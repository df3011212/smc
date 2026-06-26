# SR+SMC+VWAP 多空雙向教練｜GitHub Pages 公開網站

這個資料夾是 **可以上傳到 GitHub 的 Repository**。公開網站只部署 `docs/`，不包含本機管理後台。

## 第一次上傳

1. 先雙擊 `00_上傳前安全檢查.bat`。
2. 在 GitHub 建立空白 Repository。
3. 雙擊 `01_初始化並上傳GitHub.bat`。
4. 貼上 Repository 的 HTTPS 網址。
5. 上傳完成後，到 GitHub Repository：
   - `Settings`
   - `Pages`
   - `Build and deployment`
   - `Source` 選擇 `GitHub Actions`
5. 到 `Actions` 查看 `Deploy GitHub Pages`。

## 後續更新

1. 在本機管理工具調整手冊資料與浮水印。
2. 使用管理工具的「同步資料與全部檔案」，選擇本資料夾內的 `docs`。
3. 雙擊 `02_更新GitHub網站.bat`。

## 本機預覽

雙擊 `03_本機預覽公開網站.bat`，再開啟：

```text
http://localhost:8000/docs/
```

## 安全設計

- `docs/` 只有公開網站。
- 不含 `admin.html`。
- 不含 GitHub Token、密碼或私鑰。
- 本機管理工具在 ZIP 的另一個資料夾，不需要上傳。
- 公開網站仍不得放入個資、API Key、密碼、私鑰或未授權內容。


## v7.4 浮水印文字

公開網站的 PDF 浮水印第二行文字由 `docs/assets/js/manuals-data.js` 的 `SITE_CONFIG.watermark.copyrightText` 控制。本機管理工具可直接修改並同步此設定。
