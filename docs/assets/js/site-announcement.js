(() => {
  "use strict";

  const config = window.SITE_CONFIG?.announcement || {};
  if (config.enabled !== true) return;

  const language = (window.SR_SITE_LANGUAGE || document.documentElement.lang || "zh-Hant").toLowerCase();
  const isEnglish = language.startsWith("en");
  const mode = ["once-version", "once-session", "every-visit"].includes(config.mode) ? config.mode : "once-version";
  const version = String(config.version || "default").trim() || "default";
  const title = String(isEnglish ? (config.titleEn || config.title) : config.title || "網站重要公告").trim();
  const content = String(isEnglish ? (config.contentEn || config.content) : config.content || "").trim();
  const url = String(config.url || "").trim();
  const buttonLabel = String(isEnglish ? (config.buttonLabelEn || config.buttonLabel) : config.buttonLabel || "查看詳情").trim();
  const imageAlt = String(config.imageAlt || title || (isEnglish ? "Announcement image" : "公告圖片")).trim();
  if (!title && !content) return;

  const localKey = `srSiteAnnouncementSeen:${version}`;
  const sessionKey = `srSiteAnnouncementSession:${version}`;
  try {
    if (mode === "once-version" && localStorage.getItem(localKey) === "1") return;
    if (mode === "once-session" && sessionStorage.getItem(sessionKey) === "1") return;
  } catch {}

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const safeAssetUrl = (value = "") => {
    const raw = String(value || "").trim().replaceAll("\\", "/");
    if (!raw || raw.includes("..")) return "";
    try {
      const candidate = new URL(raw, location.href);
      return ["http:", "https:"].includes(candidate.protocol) ? candidate.href : "";
    } catch { return ""; }
  };
  const image = safeAssetUrl(config.image || "");

  const markSeen = () => {
    try {
      if (mode === "once-version") localStorage.setItem(localKey, "1");
      if (mode === "once-session") sessionStorage.setItem(sessionKey, "1");
    } catch {}
  };

  const dialog = document.createElement("dialog");
  dialog.className = "site-announcement-dialog";
  dialog.setAttribute("aria-labelledby", "siteAnnouncementTitle");
  dialog.innerHTML = `
    <div class="site-announcement-shell">
      <button class="dialog-close site-announcement-close" type="button" aria-label="${isEnglish ? "Close" : "關閉"}">×</button>
      ${image ? `<img class="site-announcement-image" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}">` : '<div class="site-announcement-icon" aria-hidden="true">!</div>'}
      <span class="eyebrow">${isEnglish ? "Website Announcement" : "網站公告"}</span>
      <h2 id="siteAnnouncementTitle">${escapeHtml(title)}</h2>
      <div class="site-announcement-content">${escapeHtml(content).replace(/\r?\n/g, "<br>")}</div>
      <div class="site-announcement-actions">
        <button class="button button-secondary site-announcement-dismiss" type="button">${isEnglish ? "I Understand" : "我知道了"}</button>
        ${url ? `<a class="button button-primary site-announcement-link" href="${escapeHtml(url)}">${escapeHtml(buttonLabel || (isEnglish ? "View Details" : "查看詳情"))}</a>` : ""}
      </div>
    </div>`;

  const close = () => {
    markSeen();
    if (dialog.open) dialog.close();
  };
  dialog.querySelector(".site-announcement-close")?.addEventListener("click", close);
  dialog.querySelector(".site-announcement-dismiss")?.addEventListener("click", close);
  dialog.querySelector(".site-announcement-link")?.addEventListener("click", markSeen);
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.append(dialog);
    window.setTimeout(() => {
      try { dialog.showModal(); } catch { dialog.setAttribute("open", ""); }
    }, 240);
  }, { once: true });
})();
