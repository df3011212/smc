(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const isEnglish = (window.SR_SITE_LANGUAGE || document.documentElement.lang || "").toLowerCase().startsWith("en");
  const rawArticles = Array.isArray(window.ARTICLES) ? window.ARTICLES : [];
  const IMAGE_MARKER_RE = /^\[\[IMAGE\|([^|\]]+)(?:\|([^\]]*))?\]\]$/i;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const safeAssetUrl = (value = "") => {
    const raw = String(value || "").trim().replaceAll("\\", "/");
    if (!raw || raw.includes("..")) return "";
    try {
      const url = new URL(raw, location.href);
      if (["http:", "https:"].includes(url.protocol)) return url.href;
    } catch {}
    return "";
  };

  const articles = rawArticles.filter(item => item && item.enabled !== false).map((item, index) => ({
    id: String(item.id || `article-${index + 1}`),
    type: ["text", "html", "embed"].includes(item.type) ? item.type : "text",
    typeLabel: String(item.typeLabel || (item.type === "embed" ? (isEnglish ? "Embedded Post" : "HTML 嵌入文章") : item.type === "html" ? "HTML 文章" : (isEnglish ? "Article" : "一般文章（純文字）"))),
    title: String(isEnglish ? (item.titleEn || item.title) : item.title || "未命名文章"),
    titleZh: String(item.title || "未命名文章"),
    summary: String(isEnglish ? (item.summaryEn || item.summary) : item.summary || ""),
    content: String(isEnglish ? (item.contentEn || item.content) : item.content || ""),
    category: String(isEnglish ? (item.categoryEn || item.category) : item.category || (isEnglish ? "Updates" : "最新消息")),
    categoryZh: String(item.category || "最新消息"),
    publishedAt: String(item.publishedAt || ""),
    featured: item.featured === true,
    coverImage: safeAssetUrl(item.coverImage || ""),
    coverAlt: String(item.coverAlt || item.title || ""),
  }));

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    siteName: $("#siteName"), siteSubtitle: $("#siteSubtitle"), footerSiteName: $("#footerSiteName"),
    donationButtons: $("#donationButtons"), tradingViewLink: $("#tradingViewLink"), threadsLink: $("#threadsLink"),
    themeToggle: $("#themeToggle"), count: $("#publicArticleCount"), grid: $("#articleGrid"),
    search: $("#articleSearch"), sort: $("#articleSort"), categories: $("#articleCategoryFilters"),
    empty: $("#articleEmptyState"), listView: $("#articleListView"), detailView: $("#articleDetailView"), detail: $("#articleDetail")
  };
  const state = { query: "", category: "all", sort: "date-desc" };

  const validUrl = (value) => {
    try {
      const url = new URL(String(value || ""), location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const formatDate = (value) => {
    if (!value) return isEnglish ? "Date not set" : "日期未設定";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(isEnglish ? "en-US" : "zh-TW", { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  const plainTextHtml = (content = "") => String(content)
    .split(/\n{2,}/)
    .map(part => {
      const trimmed = part.trim();
      const image = trimmed.match(IMAGE_MARKER_RE);
      if (image) {
        const src = safeAssetUrl(image[1]);
        const caption = String(image[2] || "").trim();
        if (!src) return "";
        return `<figure class="article-content-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(caption || (isEnglish ? "Article image" : "文章圖片"))}" loading="lazy">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
      }
      return `<p>${escapeHtml(part).replace(/\r?\n/g, "<br>")}</p>`;
    }).join("");

  const renderDonationButtons = () => {
    if (!elements.donationButtons) return;
    const items = (Array.isArray(config.donations) ? config.donations : []).filter(item => item?.enabled !== false && validUrl(item.url));
    elements.donationButtons.innerHTML = items.map(item => `<a class="button button-support donation-header-button" href="${escapeHtml(validUrl(item.url))}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">${escapeHtml(item.icon || "❤")}</span><span>${escapeHtml(isEnglish ? (item.labelEn || item.label) : item.label || "Support")}</span></a>`).join("");
  };

  const applyConfig = () => {
    const siteName = isEnglish ? (config.siteNameEn || config.siteName) : config.siteName;
    const subtitle = isEnglish ? (config.subtitleEn || config.subtitle) : config.subtitle;
    if (elements.siteName && siteName) elements.siteName.textContent = siteName;
    if (elements.footerSiteName && siteName) elements.footerSiteName.textContent = siteName;
    if (elements.siteSubtitle && subtitle) elements.siteSubtitle.textContent = subtitle;
    if (elements.tradingViewLink && config.tradingViewUrl) elements.tradingViewLink.href = config.tradingViewUrl;
    if (elements.threadsLink && config.threadsUrl) elements.threadsLink.href = config.threadsUrl;
  };

  const getFiltered = () => {
    const query = state.query.toLowerCase();
    const output = articles.filter(item => {
      const matchesCategory = state.category === "all" || item.category === state.category;
      const haystack = `${item.title} ${item.summary} ${item.category} ${item.content}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
    output.sort((a, b) => {
      if (state.sort === "date-asc") return a.publishedAt.localeCompare(b.publishedAt);
      if (state.sort === "featured") return Number(b.featured) - Number(a.featured) || b.publishedAt.localeCompare(a.publishedAt);
      return b.publishedAt.localeCompare(a.publishedAt);
    });
    return output;
  };

  const renderCategories = () => {
    if (!elements.categories) return;
    const categories = [...new Set(articles.map(item => item.category).filter(Boolean))];
    elements.categories.innerHTML = [isEnglish ? "All" : "全部", ...categories].map((label, index) => {
      const value = index === 0 ? "all" : label;
      return `<button type="button" class="category-button${state.category === value ? " is-active" : ""}" data-category="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
    }).join("");
  };

  const typeLabel = (type) => type === "embed" ? (isEnglish ? "Embedded Post" : "嵌入文章") : type === "html" ? "HTML" : (isEnglish ? "Article" : "文章");
  const renderList = () => {
    if (!elements.grid) return;
    const items = getFiltered();
    elements.grid.innerHTML = items.map(item => `
      <article class="article-public-card${item.featured ? " is-featured" : ""}">
        ${item.coverImage ? `<a class="article-card-cover" href="articles.html?id=${encodeURIComponent(item.id)}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(item.coverImage)}" alt="${escapeHtml(item.coverAlt || item.title)}" loading="lazy"></a>` : ""}
        <div class="article-card-meta"><span>${escapeHtml(item.category)}</span><time datetime="${escapeHtml(item.publishedAt)}">${escapeHtml(formatDate(item.publishedAt))}</time></div>
        <div class="article-card-badges">${item.featured ? `<span class="manual-badge badge-featured">${isEnglish ? "Featured" : "精選"}</span>` : ""}<span class="manual-badge">${escapeHtml(item.typeLabel || typeLabel(item.type))}</span></div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary || (isEnglish ? "Open this article to read the full content." : "開啟文章查看完整內容。"))}</p>
        <a class="button button-primary" href="articles.html?id=${encodeURIComponent(item.id)}">${isEnglish ? "Read Article" : "閱讀文章"}</a>
      </article>`).join("");
    if (elements.empty) elements.empty.hidden = items.length > 0;
    if (elements.count) elements.count.textContent = String(articles.length);
  };

  const THREADS_URL_RE = /https:\/\/(?:www\.)?threads\.(?:com|net)\/@[A-Za-z0-9._-]+\/post\/[A-Za-z0-9_-]+(?:[/?#][^\s"'<>]*)?/gi;

  const extractThreadsPermalinks = (content = "") => {
    const matches = String(content || "").match(THREADS_URL_RE) || [];
    return [...new Set(matches.map((value) => value.replace(/&amp;/g, "&").replace(/[),.;]+$/, "")))];
  };

  const buildThreadsFallback = (url, index = 0) => {
    const safeUrl = escapeHtml(url);
    const postId = (url.match(/\/post\/([A-Za-z0-9_-]+)/i)?.[1] || `post-${index + 1}`).replace(/[^A-Za-z0-9_-]/g, "");
    return `<blockquote class="text-post-media" data-text-post-permalink="${safeUrl}" data-text-post-version="0" id="sr-thread-${postId}-${index}" style="background:#fff;border:1px solid #00000026;border-radius:16px;max-width:650px;margin:1px auto;min-width:270px;padding:0;width:calc(100% - 2px)"><a href="${safeUrl}" style="background:#fff;display:block;padding:36px 24px;text-align:center;text-decoration:none;color:#111;font:600 15px/1.5 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" target="_blank" rel="noopener noreferrer"><div style="font-size:32px;line-height:1;margin-bottom:12px">◎</div><div>${isEnglish ? "View on Threads" : "在 Threads 查看"}</div></a></blockquote>`;
  };

  const prepareThreadsContent = (content = "") => {
    let cleaned = String(content || "")
      .replace(/<script\b[^>]*src\s*=\s*["'][^"']*threads\.com\/embed\.js[^"']*["'][^>]*>\s*<\/script>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const urls = extractThreadsPermalinks(cleaned);
    if (!urls.length) return { html: cleaned, urls, isThreads: false };
    if (!/<blockquote\b[^>]*class\s*=\s*["'][^"']*text-post-media/i.test(cleaned)) {
      const supplemental = cleaned.replace(THREADS_URL_RE, "").trim();
      cleaned = `${supplemental}${supplemental ? "<div style=\"height:14px\"></div>" : ""}${urls.map(buildThreadsFallback).join("")}`;
    }
    return { html: cleaned, urls, isThreads: true };
  };

  const buildEmbedDocument = (content, articleId, forceThreads = false) => {
    const base = new URL("./", location.href).href;
    const prepared = prepareThreadsContent(content);
    const useThreads = forceThreads || prepared.isThreads;
    const bodyContent = useThreads ? prepared.html : String(content || "");
    const threadsScript = useThreads ? '<script async src="https://www.threads.com/embed.js"><\/script>' : "";
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${escapeHtml(base)}"><style>html,body{margin:0;padding:0;background:transparent;color:#172033;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{padding:4px;overflow-wrap:anywhere}img,video,iframe{max-width:100%;height:auto}figure{margin:24px auto;text-align:center}figcaption{margin-top:8px;color:#667085;font-size:14px}blockquote{max-width:100%!important;margin-left:auto!important;margin-right:auto!important}</style></head><body>${bodyContent}${threadsScript}<script>(()=>{const send=()=>parent.postMessage({type:'sr-article-height',id:${JSON.stringify(articleId)},height:Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)},'*');if('ResizeObserver'in window)new ResizeObserver(send).observe(document.body);window.addEventListener('load',()=>{send();setTimeout(send,500);setTimeout(send,1400);setTimeout(send,3000)});send()})()<\/script></body></html>`;
  };

  const renderDetail = (item) => {
    if (!elements.detail || !elements.listView || !elements.detailView) return;
    elements.listView.hidden = true;
    elements.detailView.hidden = false;
    let body = "";
    if (item.type === "text") {
      body = `<div class="article-text-content">${plainTextHtml(item.content)}</div>`;
    } else {
      const frameId = `article-frame-${item.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
      const threadsEmbed = item.type === "embed" && extractThreadsPermalinks(item.content).length > 0;
      const sandbox = threadsEmbed
        ? "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        : "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox";
      body = `<iframe id="${escapeHtml(frameId)}" class="article-embed-frame${threadsEmbed ? " is-threads-embed" : ""}" sandbox="${sandbox}" allow="clipboard-write" title="${escapeHtml(item.title)}"></iframe>`;
    }
    elements.detail.innerHTML = `
      ${item.coverImage ? `<figure class="article-detail-cover"><img src="${escapeHtml(item.coverImage)}" alt="${escapeHtml(item.coverAlt || item.title)}"></figure>` : ""}
      <header class="article-detail-header"><div class="article-card-meta"><span>${escapeHtml(item.category)}</span><time datetime="${escapeHtml(item.publishedAt)}">${escapeHtml(formatDate(item.publishedAt))}</time></div><h1>${escapeHtml(item.title)}</h1>${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}</header>${body}
      <footer class="article-detail-footer"><a class="button button-secondary" href="articles.html">${isEnglish ? "Back to Articles" : "返回文章列表"}</a><button id="copyArticleLink" class="button button-primary" type="button">${isEnglish ? "Copy Link" : "複製文章連結"}</button></footer>`;
    if (item.type !== "text") {
      const frame = elements.detail.querySelector(".article-embed-frame");
      if (frame) {
        const threadsEmbed = frame.classList.contains("is-threads-embed");
        frame.srcdoc = buildEmbedDocument(item.content, frame.id, threadsEmbed);
      }
    }
    elements.detail.querySelector("#copyArticleLink")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href); } catch {}
      const button = elements.detail.querySelector("#copyArticleLink");
      if (button) button.textContent = isEnglish ? "Copied" : "已複製";
    });
  };

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type !== "sr-article-height" || !data.id) return;
    const frame = document.getElementById(data.id);
    if (frame?.classList.contains("article-embed-frame")) frame.style.height = `${Math.min(6000, Math.max(260, Number(data.height) || 600))}px`;
  });

  elements.categories?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category || "all";
    renderCategories(); renderList();
  });
  elements.search?.addEventListener("input", () => { state.query = elements.search.value.trim(); renderList(); });
  elements.sort?.addEventListener("change", () => { state.sort = elements.sort.value; renderList(); });

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("manualHubTheme", theme); } catch {}
    if (elements.themeToggle) elements.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  };
  elements.themeToggle?.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem("manualHubTheme") || (matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch {}
  applyTheme(savedTheme);

  applyConfig();
  renderDonationButtons();
  const requestedId = new URLSearchParams(location.search).get("id");
  const requestedArticle = requestedId ? articles.find(item => item.id === requestedId) : null;
  if (requestedArticle) renderDetail(requestedArticle);
  else { renderCategories(); renderList(); }
})();
