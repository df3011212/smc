[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
Write-Host '[INFO] 安全同步核心已移到工具根目錄。' -ForegroundColor Yellow
Write-Host '[INFO] 請執行上一層的 OPEN_FULL_TOOLKIT.cmd 或 UPDATE_GITHUB_SITE_SAFE.cmd。'
exit 0
