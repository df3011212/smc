param(
  [switch]$SyncOnly,
  [switch]$Publish,
  [switch]$RepairOnly,
  [string]$RepositoryPath
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
$toolRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($RepositoryPath)) {
  $RepositoryPath = Join-Path $toolRoot 'GitHub_Repository_Ready'
}
$repoRoot = [System.IO.Path]::GetFullPath($RepositoryPath)
$script:SafetyBackupDir = ''
if (-not (Test-Path -LiteralPath $repoRoot -PathType Container)) {
  throw "找不到 GitHub 儲存庫資料夾：$repoRoot"
}
Set-Location $repoRoot

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Warn([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "[FAILED] $Message" -ForegroundColor Red }

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [switch]$AllowFailure,
    [switch]$Quiet
  )
  if (-not $Quiet) { Write-Host ("git " + ($Arguments -join ' ')) -ForegroundColor DarkGray }

  # Windows PowerShell 5.1 會把 Git 寫到 stderr 的一般 warning
  # 包裝成 ErrorRecord。若全域 ErrorActionPreference=Stop，像 LF/CRLF
  # 這類不影響成功的警告也會被誤判成失敗。這裡只依 Git exit code 判斷。
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $gitOutput = & git @Arguments 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }

  if (-not $Quiet) {
    $gitOutput | ForEach-Object {
      $line = [string]$_
      if ($line -match '^warning:.*(?:LF will be replaced by CRLF|CRLF will be replaced by LF)') {
        Write-Host ("[Git 換行提示] " + $line.Substring(9).Trim()) -ForegroundColor DarkYellow
      } else {
        Write-Host $line
      }
    }
  }
  if (($code -ne 0) -and (-not $AllowFailure)) {
    throw "Git command failed ($code): git $($Arguments -join ' ')"
  }
  return $code
}

function Get-GitText {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
  # Windows PowerShell 5.1 可能把 Git 寫到 stderr 的一般 warning 轉成 ErrorRecord。
  # 這裡暫時停用 Stop，只依 exit code 判斷，並丟棄 stderr，避免換行提示污染解析結果。
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = & git @Arguments 2>$null
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($code -ne 0) { return '' }
  if ($null -eq $output) { return '' }
  return (($output | ForEach-Object { [string]$_ }) -join "`n").Trim()
}

function Test-RebaseOrMergeInProgress {
  $gitDir = Get-GitText -Arguments @('rev-parse', '--git-dir')
  if ([string]::IsNullOrWhiteSpace($gitDir)) { return $false }
  if (-not [System.IO.Path]::IsPathRooted($gitDir)) { $gitDir = Join-Path $repoRoot $gitDir }
  return (Test-Path (Join-Path $gitDir 'rebase-merge')) -or
         (Test-Path (Join-Path $gitDir 'rebase-apply')) -or
         (Test-Path (Join-Path $gitDir 'MERGE_HEAD')) -or
         (Test-Path (Join-Path $gitDir 'CHERRY_PICK_HEAD'))
}

function Get-ManualCountFromText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return 0 }
  $match = [regex]::Match($Text, 'window\.MANUALS\s*=\s*\[(?<body>[\s\S]*?)\];\s*window\.ARTICLES\s*=', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $match.Success) { return 0 }
  return ([regex]::Matches($match.Groups['body'].Value, '"id"\s*:', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
}

function Get-ArticleCountFromText([string]$Text) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return 0 }
  $match = [regex]::Match($Text, 'window\.ARTICLES\s*=\s*\[(?<body>[\s\S]*?)\];\s*$', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if (-not $match.Success) { return 0 }
  return ([regex]::Matches($match.Groups['body'].Value, '"id"\s*:', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
}

function Read-Utf8File([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return '' }
  return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8NoBom([string]$Path, [string]$Text) {
  $parent = Split-Path -Parent $Path
  if ($parent -and (-not (Test-Path -LiteralPath $parent))) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding -ArgumentList $false))
}

function Get-StageText([int]$Stage, [string]$Path) {
  $spec = ":$Stage`:$Path"
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $content = & git show $spec 2>$null
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($code -ne 0) { return $null }
  return (($content | ForEach-Object { [string]$_ }) -join "`n") + "`n"
}

function Get-DataSection([string]$Text, [string]$Section) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
  if ($Section -eq 'site') {
    $match = [regex]::Match($Text, '(?<value>window\.SITE_CONFIG\s*=\s*\{[\s\S]*?\};)\s*window\.MANUALS\s*=', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  } elseif ($Section -eq 'manuals') {
    $match = [regex]::Match($Text, '(?<value>window\.MANUALS\s*=\s*\[[\s\S]*?\];)\s*window\.ARTICLES\s*=', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  } else {
    $match = [regex]::Match($Text, '(?<value>window\.ARTICLES\s*=\s*\[[\s\S]*?\];)\s*$', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  }
  if ($match.Success) { return $match.Groups['value'].Value.Trim() }
  return ''
}

function Get-AssignedJson([string]$Text, [string]$VariableName) {
  if ([string]::IsNullOrWhiteSpace($Text)) { return '' }
  $sectionName = if ($VariableName -eq 'SITE_CONFIG') { 'site' } elseif ($VariableName -eq 'MANUALS') { 'manuals' } else { 'articles' }
  $section = Get-DataSection $Text $sectionName
  if ([string]::IsNullOrWhiteSpace($section)) { return '' }
  $escaped = [regex]::Escape($VariableName)
  $match = [regex]::Match($section, "^window\\.$escaped\\s*=\\s*(?<json>[\\s\\S]*)\\s*;\\s*$", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  if ($match.Success) { return $match.Groups['json'].Value.Trim() }
  return ''
}

function Merge-AssignedJsonArrayById([string]$RemoteText, [string]$LocalText, [string]$VariableName) {
  $remoteJson = Get-AssignedJson $RemoteText $VariableName
  $localJson = Get-AssignedJson $LocalText $VariableName
  if ([string]::IsNullOrWhiteSpace($remoteJson) -or [string]::IsNullOrWhiteSpace($localJson)) { return '' }
  try {
    $remoteItems = @($remoteJson | ConvertFrom-Json)
    $localItems = @($localJson | ConvertFrom-Json)
  } catch {
    Write-Warn "$VariableName JSON 解析失敗，改用數量保護規則。"
    return ''
  }

  $merged = New-Object System.Collections.Specialized.OrderedDictionary
  $remoteIndex = 0
  foreach ($item in $remoteItems) {
    $remoteIndex++
    $key = [string]$item.id
    if ([string]::IsNullOrWhiteSpace($key)) { $key = [string]$item.title }
    if ([string]::IsNullOrWhiteSpace($key)) { $key = "__remote_$remoteIndex" }
    if (-not $merged.Contains($key)) { $merged.Add($key, $item) }
  }

  $localIndex = 0
  foreach ($item in $localItems) {
    $localIndex++
    $key = [string]$item.id
    if ([string]::IsNullOrWhiteSpace($key)) { $key = [string]$item.title }
    if ([string]::IsNullOrWhiteSpace($key)) { $key = "__local_$localIndex" }
    if ($merged.Contains($key)) { $merged[$key] = $item }
    else { $merged.Add($key, $item) }
  }

  $items = @($merged.Values)
  $json = ConvertTo-Json -InputObject $items -Depth 100
  return "window.$VariableName = $json;"
}

function Merge-ManualsDataText([string]$RemoteText, [string]$LocalText) {
  $remoteManuals = Get-ManualCountFromText $RemoteText
  $localManuals = Get-ManualCountFromText $LocalText
  $remoteArticles = Get-ArticleCountFromText $RemoteText
  $localArticles = Get-ArticleCountFromText $LocalText
  Write-Info "手冊資料比較：GitHub/基準 $remoteManuals 本，本機修改 $localManuals 本；文章 $remoteArticles / $localArticles 篇。"

  $localSite = Get-DataSection $LocalText 'site'
  $remoteSite = Get-DataSection $RemoteText 'site'
  $site = $(if (-not [string]::IsNullOrWhiteSpace($localSite)) { $localSite } else { $remoteSite })

  $localManualSection = Get-DataSection $LocalText 'manuals'
  $remoteManualSection = Get-DataSection $RemoteText 'manuals'
  $manuals = Merge-AssignedJsonArrayById $RemoteText $LocalText 'MANUALS'
  if ([string]::IsNullOrWhiteSpace($manuals)) {
    if ($localManuals -ge $remoteManuals) { $manuals = $localManualSection } else { $manuals = $remoteManualSection }
  }

  $localArticleSection = Get-DataSection $LocalText 'articles'
  $remoteArticleSection = Get-DataSection $RemoteText 'articles'
  $articles = Merge-AssignedJsonArrayById $RemoteText $LocalText 'ARTICLES'
  if ([string]::IsNullOrWhiteSpace($articles)) {
    if ($localArticles -ge $remoteArticles) { $articles = $localArticleSection } else { $articles = $remoteArticleSection }
  }

  if ((-not [string]::IsNullOrWhiteSpace($site)) -and
      (-not [string]::IsNullOrWhiteSpace($manuals)) -and
      (-not [string]::IsNullOrWhiteSpace($articles))) {
    $header = '/* 安全同步工具自動合併：保留本機網站設定及較完整的手冊／文章資料 */'
    return $header + "`r`n" + $site + "`r`n`r`n" + $manuals + "`r`n`r`n" + $articles + "`r`n"
  }

  if ($localManuals -gt $remoteManuals) { return $LocalText }
  if ($remoteManuals -gt $localManuals) { return $RemoteText }
  if ($localArticles -gt $remoteArticles) { return $LocalText }
  if ($remoteArticles -gt $localArticles) { return $RemoteText }
  return $LocalText
}

function Test-StageExists([int]$Stage, [string]$Path) {
  $spec = ":$Stage`:$Path"
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    & git cat-file -e $spec 2>$null
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  return ($code -eq 0)
}

function Resolve-UnmergedFiles {
  $filesText = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
  if ([string]::IsNullOrWhiteSpace($filesText)) { return $true }
  $files = $filesText -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
  Write-Warn "偵測到 $($files.Count) 個衝突，啟用安全自動合併。"

  foreach ($file in $files) {
    $normalized = $file.Replace('\', '/')
    if ($normalized -eq 'docs/assets/js/manuals-data.js') {
      $remoteText = Get-StageText 2 $file
      $localText = Get-StageText 3 $file
      if (($null -eq $remoteText) -and ($null -eq $localText)) {
        Write-Fail "無法讀取手冊衝突版本：$file"
        return $false
      }
      if ($null -eq $remoteText) { $selected = $localText }
      elseif ($null -eq $localText) { $selected = $remoteText }
      else { $selected = Merge-ManualsDataText $remoteText $localText }
      Write-Utf8NoBom (Join-Path $repoRoot $file) $selected
      Invoke-Git -Arguments @('add', '--', $file) | Out-Null
      Write-Ok "已安全保留較完整的手冊與文章資料：$file"
      continue
    }

    if ($normalized -eq 'docs/index.html') {
      # stash apply 衝突時：stage 2 是 GitHub 最新版，stage 3 是本機暫存版。
      # 首頁改版採用本機版；手冊資料則由上方專用合併器保護。
      $checkoutCode = Invoke-Git -Arguments @('checkout', '--theirs', '--', $file) -AllowFailure -Quiet
      if ($checkoutCode -ne 0) {
        Write-Fail "無法安全取回本機首頁版本：$file"
        return $false
      }
      Invoke-Git -Arguments @('add', '--', $file) | Out-Null
      Write-Ok "已保留本機首頁改版並標記衝突完成：$file"
      continue
    }

    if (-not (Test-StageExists 3 $file)) {
      Invoke-Git -Arguments @('rm', '-f', '--', $file) -AllowFailure | Out-Null
      Write-Info "依本機修改移除：$file"
    } else {
      $checkoutCode = Invoke-Git -Arguments @('checkout', '--theirs', '--', $file) -AllowFailure -Quiet
      if ($checkoutCode -ne 0) {
        Write-Fail "無法安全取回本機版本：$file"
        return $false
      }
      Invoke-Git -Arguments @('add', '--', $file) | Out-Null
      Write-Info "保留本機最新修改：$file"
    }
  }
  return $true
}

function Continue-RebaseSafely {
  while (Test-RebaseOrMergeInProgress) {
    $unmerged = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
    if (-not [string]::IsNullOrWhiteSpace($unmerged)) {
      if (-not (Resolve-UnmergedFiles)) { return $false }
    }
    $code = Invoke-Git -Arguments @('-c', 'core.editor=true', 'rebase', '--continue') -AllowFailure
    if ($code -eq 0) { continue }
    $stillUnmerged = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
    if ([string]::IsNullOrWhiteSpace($stillUnmerged) -and (Test-RebaseOrMergeInProgress)) {
      Write-Warn '此筆提交內容已存在於 GitHub，略過空白提交。'
      $skipCode = Invoke-Git -Arguments @('rebase', '--skip') -AllowFailure
      if ($skipCode -ne 0) { return $false }
    } else {
      return $false
    }
  }
  return $true
}

function Sync-WithRemoteSafely {
  Write-Info '取得 GitHub 最新版本…'
  $fetchCode = Invoke-Git -Arguments @('fetch', 'origin', 'main') -AllowFailure
  if ($fetchCode -ne 0) { return $false }

  $counts = Get-GitText -Arguments @('rev-list', '--left-right', '--count', 'HEAD...origin/main')
  if ([string]::IsNullOrWhiteSpace($counts)) { throw '無法比較本機與 GitHub 版本。' }
  $parts = $counts -split '\s+'
  $ahead = [int]$parts[0]
  $behind = [int]$parts[1]
  Write-Info "版本狀態：本機領先 $ahead 筆，GitHub 領先 $behind 筆。"

  if (($ahead -eq 0) -and ($behind -eq 0)) {
    Write-Ok '本機與 GitHub 已同步。'
    return $true
  }

  if (($ahead -eq 0) -and ($behind -gt 0)) {
    $code = Invoke-Git -Arguments @('merge', '--ff-only', 'origin/main') -AllowFailure
    if ($code -ne 0) { return $false }
    Write-Ok '已安全快轉到 GitHub 最新版本。'
    return $true
  }

  if ($ahead -gt 0) {
    $backupBranch = 'safe-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    Invoke-Git -Arguments @('branch', $backupBranch, 'HEAD') -AllowFailure | Out-Null
    Write-Warn "本機已有尚未上傳的提交，已建立保護分支：$backupBranch"
    $code = Invoke-Git -Arguments @('rebase', 'origin/main') -AllowFailure
    if ($code -eq 0) {
      Write-Ok '本機提交已接到 GitHub 最新版本之後。'
      return $true
    }
    if (Test-RebaseOrMergeInProgress) {
      if (Continue-RebaseSafely) {
        Write-Ok '衝突已安全處理，rebase 完成。'
        return $true
      }
      Invoke-Git -Arguments @('rebase', '--abort') -AllowFailure | Out-Null
    }
    Write-Fail "無法安全整合；已保留保護分支 $backupBranch，未強制覆蓋任何資料。"
    return $false
  }

  return $true
}

function Get-CurrentManualCount {
  $path = Join-Path $repoRoot 'docs/assets/js/manuals-data.js'
  return Get-ManualCountFromText (Read-Utf8File $path)
}

function Test-ReferencedManualFiles {
  param([switch]$WarnOnly)
  $dataPath = Join-Path $repoRoot 'docs/assets/js/manuals-data.js'
  $text = Read-Utf8File $dataPath
  if ([string]::IsNullOrWhiteSpace($text)) {
    Write-Fail '找不到 manuals-data.js 或檔案為空白。'
    return $false
  }
  $matches = [regex]::Matches($text, '"file"\s*:\s*"(?<path>files/[^"\r\n]+)"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $missing = New-Object System.Collections.Generic.List[string]
  foreach ($m in $matches) {
    $relative = $m.Groups['path'].Value.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $full = Join-Path (Join-Path $repoRoot 'docs') $relative
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { $missing.Add($m.Groups['path'].Value) }
  }
  if ($missing.Count -gt 0) {
    if ($WarnOnly) {
      Write-Warn '以下手冊附件不存在；已允許開啟後台，請在「Docs Inspector」刪除遺失手冊資料或重新指定附件：'
      $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    } else {
      Write-Fail '以下手冊附件不存在，已停止發布：'
      $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    }
    return $false
  }
  Write-Ok "手冊資料與附件檢查通過，共 $($matches.Count) 個附件連結。"
  return $true
}

function Test-ConflictMarkers {
  $files = Get-ChildItem -Path (Join-Path $repoRoot 'docs') -Recurse -File -Include @('*.html', '*.css', '*.js', '*.md', '*.txt') -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $content = Read-Utf8File $file.FullName
    if ($content -match '(?m)^(<<<<<<<|=======|>>>>>>>)') {
      Write-Fail "檔案仍含 Git 衝突標記：$($file.FullName)"
      return $false
    }
  }
  return $true
}

function New-SafetyBackup {
  $parent = Split-Path -Parent $repoRoot
  $backupRoot = Join-Path $parent '_Git_Safe_Backups'
  $backupDir = Join-Path $backupRoot (Get-Date -Format 'yyyyMMdd_HHmmss')
  New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
  $critical = @(
    'docs/assets/js/manuals-data.js',
    'docs/assets/js/app.js',
    'docs/assets/css/style.css',
    'docs/index.html'
  )
  foreach ($relative in $critical) {
    $source = Join-Path $repoRoot $relative
    if (Test-Path -LiteralPath $source -PathType Leaf) {
      $target = Join-Path $backupDir $relative
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
      Copy-Item -LiteralPath $source -Destination $target -Force
    }
  }
  (Get-GitText -Arguments @('status', '--short', '--untracked-files=all')) | Set-Content -LiteralPath (Join-Path $backupDir 'git-status-before.txt') -Encoding UTF8
  (Get-GitText -Arguments @('log', '-1', '--oneline')) | Set-Content -LiteralPath (Join-Path $backupDir 'git-head-before.txt') -Encoding UTF8

  if (Test-Path $backupRoot) {
    $old = Get-ChildItem $backupRoot -Directory | Sort-Object Name -Descending | Select-Object -Skip 10
    $old | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  }
  Write-Ok "已建立安全備份：$backupDir"
  return $backupDir
}

function Find-StashRefByHash([string]$Hash) {
  if ([string]::IsNullOrWhiteSpace($Hash)) { return '' }
  $lines = Get-GitText -Arguments @('stash', 'list', '--format=%H|%gd')
  foreach ($line in ($lines -split "`n")) {
    $parts = $line -split '\|', 2
    if (($parts.Count -eq 2) -and ($parts[0] -eq $Hash)) { return $parts[1] }
  }
  return ''
}

function Restore-StashUntrackedFilesSafely([string]$StashHash) {
  if ([string]::IsNullOrWhiteSpace($StashHash)) { return $true }
  $untrackedCommit = "$StashHash^3"
  $parentCode = Invoke-Git -Arguments @('cat-file', '-e', $untrackedCommit) -AllowFailure -Quiet
  if ($parentCode -ne 0) { return $false }

  $pathsText = Get-GitText -Arguments @('ls-tree', '-r', '--name-only', $untrackedCommit)
  if ([string]::IsNullOrWhiteSpace($pathsText)) { return $true }
  $paths = $pathsText -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

  foreach ($path in $paths) {
    $stashSpec = "$untrackedCommit`:$path"
    $stashHashValue = Get-GitText -Arguments @('rev-parse', $stashSpec)
    $workingPath = Join-Path $repoRoot $path
    $workingHashValue = ''
    if (Test-Path -LiteralPath $workingPath -PathType Leaf) {
      $workingHashValue = Get-GitText -Arguments @('hash-object', '--', $path)
    }

    if ((-not [string]::IsNullOrWhiteSpace($stashHashValue)) -and ($stashHashValue -eq $workingHashValue)) {
      Write-Info "未追蹤檔案已存在且內容相同，直接保留：$path"
      continue
    }

    if ((Test-Path -LiteralPath $workingPath -PathType Leaf) -and (-not [string]::IsNullOrWhiteSpace($script:SafetyBackupDir))) {
      $collisionBackup = Join-Path (Join-Path $script:SafetyBackupDir 'stash-untracked-collision') $path
      New-Item -ItemType Directory -Force -Path (Split-Path -Parent $collisionBackup) | Out-Null
      Copy-Item -LiteralPath $workingPath -Destination $collisionBackup -Force
      Write-Warn "同名檔案內容不同，已先備份目前版本：$collisionBackup"
    }

    $checkoutCode = Invoke-Git -Arguments @('checkout', $untrackedCommit, '--', $path) -AllowFailure
    if ($checkoutCode -ne 0) {
      Write-Fail "無法從 Git 暫存還原未追蹤檔案：$path"
      return $false
    }
    Write-Ok "已還原本機未追蹤檔案：$path"
  }
  return $true
}

function Restore-StashSafely([string]$StashHash) {
  if ([string]::IsNullOrWhiteSpace($StashHash)) { return $true }
  Write-Info '還原本機尚未發布的修改…'
  $code = Invoke-Git -Arguments @('stash', 'apply', $StashHash) -AllowFailure
  if ($code -eq 0) {
    Write-Ok '本機修改已還原。'
    return $true
  }
  $unmerged = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
  if ([string]::IsNullOrWhiteSpace($unmerged)) {
    if (Restore-StashUntrackedFilesSafely $StashHash) {
      Write-Ok 'Git 暫存中的未追蹤檔案已安全處理。'
      return $true
    }
    Write-Fail '暫存還原失敗，但沒有可自動處理的合併衝突。暫存仍完整保留。'
    return $false
  }
  if (-not (Resolve-UnmergedFiles)) { return $false }
  $remainingUnmerged = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
  if (-not [string]::IsNullOrWhiteSpace($remainingUnmerged)) {
    Write-Fail '自動處理後仍有未解決衝突，已停止；Git 暫存與安全備份仍保留。'
    return $false
  }
  Write-Ok '暫存衝突已安全處理；手冊採用合併後較完整版本，首頁保留本機改版。'
  return $true
}

function Drop-StashByHash([string]$StashHash) {
  $ref = Find-StashRefByHash $StashHash
  if (-not [string]::IsNullOrWhiteSpace($ref)) {
    Invoke-Git -Arguments @('stash', 'drop', $ref) -AllowFailure | Out-Null
  }
}

try {
  Write-Host '==================================================' -ForegroundColor White
  if ($Publish) { Write-Host 'SR+SMC GitHub 安全同步與發布工具' -ForegroundColor White }
  else { Write-Host 'SR+SMC 開啟後台前安全同步' -ForegroundColor White }
  Write-Host '==================================================' -ForegroundColor White

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw '找不到 Git for Windows，請先安裝 Git。'
  }

  if (-not (Test-Path (Join-Path $repoRoot '.git'))) {
    if ($SyncOnly) {
      Write-Warn '尚未初始化 Git；首次使用請先執行 01_FIRST_UPLOAD_TO_GITHUB.cmd。此次仍可開啟後台。'
      exit 0
    }
    throw 'Git 尚未初始化，請先執行 01_FIRST_UPLOAD_TO_GITHUB.cmd。'
  }

  if (Test-RebaseOrMergeInProgress) {
    throw '偵測到尚未完成的 rebase／merge。為避免資料損壞，本工具已停止。請先完成或中止目前 Git 操作。'
  }

  # v8.1.23 可能在 stash apply 衝突時因 PowerShell 5.1 的換行 warning 中止。
  # 此時沒有 MERGE_HEAD，但 index 仍有 U 狀態。v8.1.24 會先安全完成該衝突。
  $existingUnmerged = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
  if (-not [string]::IsNullOrWhiteSpace($existingUnmerged)) {
    Write-Warn '偵測到上一次安全同步留下的未完成 stash 衝突，現在自動修復。'
    if (-not (Resolve-UnmergedFiles)) {
      throw '無法安全修復既有衝突。請保留目前資料夾與 _Git_Safe_Backups，勿執行 reset --hard。'
    }
    $remaining = Get-GitText -Arguments @('diff', '--name-only', '--diff-filter=U')
    if (-not [string]::IsNullOrWhiteSpace($remaining)) {
      throw '仍有未解決衝突，已停止。'
    }
    Write-Ok '既有 stash 衝突已修復並標記完成。'
  }

  if ($RepairOnly) {
    if (-not (Test-ReferencedManualFiles)) { throw '手冊附件檢查未通過。' }
    if (-not (Test-ConflictMarkers)) { throw '仍有衝突標記，已停止。' }
    Write-Ok '目前 Git 衝突狀態已修復。接著可執行 OPEN_FULL_TOOLKIT.cmd。'
    exit 0
  }

  $remote = Get-GitText -Arguments @('remote', 'get-url', 'origin')
  if ([string]::IsNullOrWhiteSpace($remote)) {
    throw '找不到 origin 遠端網址，請先完成第一次上傳設定。'
  }

  $backupDir = New-SafetyBackup
  $script:SafetyBackupDir = $backupDir
  $manualCountBefore = Get-CurrentManualCount
  Write-Info "同步前手冊數量：$manualCountBefore 本。"

  $statusBefore = Get-GitText -Arguments @('status', '--porcelain', '--untracked-files=all')
  $manualDataWasModifiedBefore = $statusBefore -match '(?m)docs/assets/js/manuals-data\.js$'
  $stashHash = ''
  if (-not [string]::IsNullOrWhiteSpace($statusBefore)) {
    $stashMessage = 'AUTO_SAFE_UPDATE_' + (Get-Date -Format 'yyyyMMdd_HHmmss')
    Write-Info '先暫存本機修改，避免 pull/rebase 覆蓋資料…'
    $stashCode = Invoke-Git -Arguments @('stash', 'push', '-u', '-m', $stashMessage) -AllowFailure
    if ($stashCode -ne 0) { throw '無法建立 Git 暫存，已停止。安全備份仍在。' }
    $stashHash = Get-GitText -Arguments @('rev-parse', 'refs/stash')
    Write-Ok "本機修改已暫存：$stashMessage"
  }

  $synced = Sync-WithRemoteSafely
  if (-not $synced) {
    if ($SyncOnly) {
      Write-Warn '目前無法連線或安全同步；後台仍會開啟，但發布前請重新連線。'
      if (-not [string]::IsNullOrWhiteSpace($stashHash)) {
        $restoredOffline = Restore-StashSafely $stashHash
        if ($restoredOffline) { Drop-StashByHash $stashHash }
      }
      exit 0
    }
    if (-not [string]::IsNullOrWhiteSpace($stashHash)) { Restore-StashSafely $stashHash | Out-Null }
    throw 'GitHub 同步失敗。沒有強制推送，暫存與安全備份均已保留。'
  }

  $manualCountRemote = Get-CurrentManualCount
  if (-not [string]::IsNullOrWhiteSpace($stashHash)) {
    if (-not (Restore-StashSafely $stashHash)) {
      throw '無法安全還原本機修改。暫存尚未刪除，可由備份復原。'
    }
  }

  $manualCountFinal = Get-CurrentManualCount
  if ($manualDataWasModifiedBefore) {
    $minimumManuals = $manualCountBefore
    Write-Info "偵測到 manuals-data.js 有本機修改；若附件檢查通過，允許使用者有意刪除舊手冊資料。"
  } else {
    $minimumManuals = [Math]::Max($manualCountBefore, $manualCountRemote)
  }
  if ($manualCountFinal -lt $minimumManuals) {
    $localBackup = Join-Path $backupDir 'docs/assets/js/manuals-data.js'
    if (Test-Path -LiteralPath $localBackup) {
      $backupCount = Get-ManualCountFromText (Read-Utf8File $localBackup)
      if ($backupCount -ge $minimumManuals) {
        Copy-Item -LiteralPath $localBackup -Destination (Join-Path $repoRoot 'docs/assets/js/manuals-data.js') -Force
        $manualCountFinal = $backupCount
        Write-Warn '偵測到手冊數量下降，已自動還原安全備份。'
      }
    }
  }
  if ($manualCountFinal -lt $minimumManuals) {
    throw "手冊數量由至少 $minimumManuals 本降為 $manualCountFinal 本，為避免遺失已停止發布。"
  }

  $manualFilesOk = Test-ReferencedManualFiles -WarnOnly:$SyncOnly
  if (-not (Test-ConflictMarkers)) { throw '仍有衝突標記，已停止。' }

  if ($SyncOnly) {
    if (-not [string]::IsNullOrWhiteSpace($stashHash)) { Drop-StashByHash $stashHash }
    if ($manualFilesOk) {
      Write-Ok '開啟後台前同步完成。'
    } else {
      Write-Warn 'Git 同步已完成，但有遺失附件資料。後台仍會開啟，請掃描 docs/files 後使用「刪除遺失手冊資料」。'
    }
    exit 0
  }

  if (-not $manualFilesOk) { throw '手冊附件檢查未通過。請先在後台刪除遺失手冊資料或重新指定附件。' }

  $commitMessage = Read-Host '更新說明（直接按 Enter 使用預設）'
  if ([string]::IsNullOrWhiteSpace($commitMessage)) { $commitMessage = 'Update manual website' }

  Invoke-Git -Arguments @('add', '-A') | Out-Null
  $cachedDiff = Invoke-Git -Arguments @('diff', '--cached', '--quiet') -AllowFailure -Quiet
  if ($cachedDiff -eq 0) {
    Write-Warn '沒有偵測到需要發布的變更。'
    if (-not [string]::IsNullOrWhiteSpace($stashHash)) { Drop-StashByHash $stashHash }
    exit 0
  }

  Invoke-Git -Arguments @('diff', '--cached', '--check') | Out-Null
  Invoke-Git -Arguments @('commit', '-m', $commitMessage) | Out-Null
  Write-Ok '本機提交完成。發布前再次確認 GitHub 是否有新版本…'

  if (-not (Sync-WithRemoteSafely)) {
    throw '提交後再次同步失敗；尚未 push，沒有覆蓋 GitHub。'
  }

  if (-not (Test-ReferencedManualFiles)) { throw '最終手冊附件檢查未通過。' }
  $finalCountAfterRebase = Get-CurrentManualCount
  if ($finalCountAfterRebase -lt $minimumManuals) {
    throw "最終手冊數量異常：$finalCountAfterRebase 本，已停止 push。"
  }

  Invoke-Git -Arguments @('push', 'origin', 'main') | Out-Null
  Write-Ok '已成功推送至 GitHub，GitHub Pages 將自動部署。'
  if (-not [string]::IsNullOrWhiteSpace($stashHash)) { Drop-StashByHash $stashHash }
  Write-Info "安全備份保留於：$backupDir"
  exit 0
}
catch {
  Write-Fail $_.Exception.Message
  Write-Warn '本工具不會執行 git push --force。發生錯誤時，Git 暫存與 _Git_Safe_Backups 會保留，避免手冊與修改遺失。'
  Write-Warn '若畫面顯示已建立 AUTO_SAFE_UPDATE 暫存，可在工具根目錄執行 RECOVER_AUTO_STASH.cmd 安全還原。'
  exit 1
}
