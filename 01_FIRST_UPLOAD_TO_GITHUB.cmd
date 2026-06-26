@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo SR+SMC First GitHub Upload Tool
 echo ==================================================
echo Create an EMPTY GitHub repository first. Do not add a README on GitHub.
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git for Windows was not found.
  echo Install Git for Windows, then run this file again.
  pause
  exit /b 1
)

set /p REPO_URL=Paste the Repository HTTPS URL: 
if "%REPO_URL%"=="" (
  echo [ERROR] No URL was entered.
  pause
  exit /b 1
)

git init
if errorlevel 1 goto :error
git branch -M main
git add .
git commit -m "Initial SR SMC manual website"
if errorlevel 1 echo [NOTICE] A matching commit may already exist. Continuing.
git remote remove origin >nul 2>nul
git remote add origin "%REPO_URL%"
if errorlevel 1 goto :error
git push -u origin main
if errorlevel 1 goto :error

echo.
echo [DONE] Files were uploaded.
echo On GitHub open: Settings ^> Pages ^> Source ^> GitHub Actions.
echo Then check the Actions page for deployment status.
pause
exit /b 0

:error
echo.
echo [FAILED] Review the Git message above.
echo Common causes: wrong URL, login not completed, or repository is not empty.
pause
exit /b 1
