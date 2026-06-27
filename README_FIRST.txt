GitHub Repository Upload Folder
===============================

只上傳這個 GitHub_Repository_Ready 資料夾內的內容。
不要把上一層的 Local_Admin_Tool_DO_NOT_UPLOAD 上傳。

工具：
- 00_SECURITY_CHECK.cmd：上傳前安全檢查
- 01_FIRST_UPLOAD_TO_GITHUB.cmd：第一次初始化並上傳
- 02_UPDATE_GITHUB_SITE.cmd：後續更新網站
- 03_PREVIEW_PUBLIC_SITE.cmd：本機預覽公開網站

GitHub Pages 發布資料夾：docs


v8.1.6：公開網站 PDF 預覽已取消額外線上浮水印，直接顯示 docs/files 內的 PDF。
安全更新工具：
- 00_SYNC_BEFORE_EDIT.cmd：開啟後台前取得 GitHub 最新版本。
- SAFE_GIT_UPDATE.ps1：自動備份、暫存、同步、衝突保護與手冊附件檢查。
- 02_UPDATE_GITHUB_SITE.cmd：安全提交並推送，不使用強制推送。

後續更新請直接使用 02_UPDATE_GITHUB_SITE.cmd，不需要手動執行 git pull／stash／rebase／push。
