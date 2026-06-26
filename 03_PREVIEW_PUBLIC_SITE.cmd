@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "SITE_URL=http://localhost:8000/docs/"

where py >nul 2>nul
if not errorlevel 1 (
  start "" "%SITE_URL%"
  py -m http.server 8000
  exit /b
)

where python >nul 2>nul
if not errorlevel 1 (
  start "" "%SITE_URL%"
  python -m http.server 8000
  exit /b
)

echo [NOTICE] Python was not found. Opening docs\index.html directly.
start "" "%~dp0docs\index.html"
pause
