@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo GitHub Pages Upload Safety Check
echo ==================================================
set FAILED=0

if not exist "docs\index.html" (
  echo [ERROR] Missing docs\index.html
  set FAILED=1
) else (
  echo [PASS] docs\index.html exists
)

if exist "docs\admin.html" (
  echo [ERROR] docs\admin.html must not be public
  set FAILED=1
) else (
  echo [PASS] No public admin.html
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$patterns='ghp_','github_pat_','BEGIN PRIVATE KEY','BEGIN RSA PRIVATE KEY','sk-proj-'; $textExt='.html','.htm','.js','.mjs','.css','.json','.txt','.md','.yml','.yaml','.xml','.csv'; $targets=Get-ChildItem -Path '.\docs' -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $textExt -contains $_.Extension.ToLowerInvariant() }; $hits=$targets | Select-String -SimpleMatch -Pattern $patterns -ErrorAction SilentlyContinue; if($hits){$hits | Select-Object Path,LineNumber,Line | Format-Table -AutoSize; exit 2}else{exit 0}"
if errorlevel 2 (
  echo [WARNING] Possible Token, API key or private key text found.
  set FAILED=1
) else (
  echo [PASS] No common token/private-key pattern found
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$large=Get-ChildItem -Path '.\docs' -Recurse -File | Where-Object Length -gt 90MB; if($large){$large | Select-Object FullName,@{N='MB';E={[math]::Round($_.Length/1MB,1)}} | Format-Table -AutoSize; exit 3}else{exit 0}"
if errorlevel 3 (
  echo [WARNING] A public file is larger than 90 MB.
  set FAILED=1
) else (
  echo [PASS] No public file larger than 90 MB
)

if "%FAILED%"=="1" (
  echo.
  echo [RESULT] Fix the issues before uploading.
) else (
  echo.
  echo [RESULT] Basic safety check passed.
)
pause
