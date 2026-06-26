@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo SR+SMC GitHub Website Update Tool
echo ==================================================

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git for Windows was not found.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [ERROR] Git is not initialized. Run 01_FIRST_UPLOAD_TO_GITHUB.cmd first.
  pause
  exit /b 1
)

set "COMMIT_MSG=Update manual website"
set /p USER_MSG=Update description (press Enter for default): 
if not "%USER_MSG%"=="" set "COMMIT_MSG=%USER_MSG%"

git add docs .github LEGAL_NOTICE.md SECURITY.md README.md
git diff --cached --quiet
if not errorlevel 1 (
  echo [NOTICE] No changes were found.
  pause
  exit /b 0
)

git commit -m "%COMMIT_MSG%"
if errorlevel 1 goto :error
git push
if errorlevel 1 goto :error

echo.
echo [DONE] Changes were pushed. GitHub Actions will update Pages automatically.
pause
exit /b 0

:error
echo.
echo [FAILED] Review the Git message above.
pause
exit /b 1
