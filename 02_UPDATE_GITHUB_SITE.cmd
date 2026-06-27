@echo off
setlocal
chcp 65001 >nul
set "LAUNCHER=%~dp0..\UPDATE_GITHUB_SITE_SAFE.cmd"
if not exist "%LAUNCHER%" (
  echo [ERROR] 找不到安全發布器：%LAUNCHER%
  pause
  exit /b 1
)
start "" "%LAUNCHER%"
exit /b 0
