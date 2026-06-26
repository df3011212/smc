(() => {
  "use strict";

  const link = document.querySelector("#rightsContactLink");
  const note = document.querySelector("#rightsContactNote");
  if (!link) return;

  const host = window.location.hostname;
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  if (host.endsWith(".github.io")) {
    const owner = host.split(".")[0];
    const repository = pathParts[0] || `${owner}.github.io`;
    const title = encodeURIComponent("權利通知／內容下架申請");
    const body = encodeURIComponent([
      "請提供：",
      "1. 通知人姓名或單位與聯絡方式",
      "2. 權利內容與權利基礎",
      "3. 涉及內容的網址、檔名或頁面位置",
      "4. 希望採取的處理方式",
      "5. 善意與資料真實聲明",
      "",
      "請勿公開張貼身分證、銀行資料、密碼、API 金鑰、私鑰或助記詞。"
    ].join("\n"));
    link.href = `https://github.com/${owner}/${repository}/issues/new?title=${title}&body=${body}`;
    link.hidden = false;
    if (note) note.textContent = `將前往 ${owner}/${repository} 的 GitHub Issues。`;
    return;
  }

  link.hidden = true;
  if (note) note.textContent = "目前無法從自訂網域自動判斷 Repository。請由網站管理者在上線前於本頁補上 GitHub Issues 或專用聯絡信箱。";
})();
