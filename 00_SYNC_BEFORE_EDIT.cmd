@echo off
setlocal
chcp 65001 >nul
echo [INFO] 安全同步器已移到工具根目錄，避免 Git stash 暫存正在執行的批次檔。
echo [INFO] 請直接執行根目錄的 OPEN_FULL_TOOLKIT.cmd 或 SYNC_BEFORE_EDIT.cmd。
pause
exit /b 0
