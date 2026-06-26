(() => {
  "use strict";

  const getManualSource = () => (Array.isArray(window.MANUALS) ? [...window.MANUALS] : []);

  let manuals = getManualSource();
  const config = window.SITE_CONFIG || {};

  const elements = {
    siteName: document.querySelector("#siteName"),
    footerSiteName: document.querySelector("#footerSiteName"),
    siteSubtitle: document.querySelector("#siteSubtitle"),
    heroTitle: document.querySelector("#heroTitle"),
    heroLead: document.querySelector("#heroLead"),
    siteNotice: document.querySelector("#siteNotice"),
    localDraftNotice: document.querySelector("#localDraftNotice"),
    manualCount: document.querySelector("#manualCount"),
    categoryCount: document.querySelector("#categoryCount"),
    latestDate: document.querySelector("#latestDate"),
    searchInput: document.querySelector("#searchInput"),
    sortSelect: document.querySelector("#sortSelect"),
    categoryFilters: document.querySelector("#categoryFilters"),
    manualGrid: document.querySelector("#manualGrid"),
    resultSummary: document.querySelector("#resultSummary"),
    emptyState: document.querySelector("#emptyState"),
    resetFilters: document.querySelector("#resetFilters"),
    themeToggle: document.querySelector("#themeToggle"),
    detailDialog: document.querySelector("#detailDialog"),
    dialogContent: document.querySelector("#dialogContent"),
    dialogClose: document.querySelector(".dialog-close"),
    downloadDialog: document.querySelector("#downloadDialog"),
    downloadAgreement: document.querySelector("#downloadAgreement"),
    confirmDownload: document.querySelector("#confirmDownload"),
    cancelDownload: document.querySelector("#cancelDownload"),
    currentYear: document.querySelector("#currentYear"),
    heroCarousel: document.querySelector("#heroCarousel"),
    heroSlides: Array.from(document.querySelectorAll(".hero-slide")),
    heroDotsWrap: document.querySelector("#heroDots"),
    heroDots: Array.from(document.querySelectorAll(".hero-dot")),
    heroPrev: document.querySelector("#heroPrev"),
    heroNext: document.querySelector("#heroNext")
  };

  const state = {
    query: "",
    category: "全部",
    sort: "updated-desc",
    carouselIndex: 0
  };

  const legalVersion = config.legalVersion || "2026-06-26";
  let pendingDownload = null;
  let carouselTimer = null;
  let activePreviewObjectUrl = null;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (value) => {
    const date = normalizeDate(value);
    if (!date) return value || "未設定";
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  };

  const getExtension = (path = "") => {
    const clean = path.split("?")[0].split("#")[0];
    const part = clean.includes(".") ? clean.split(".").pop() : "FILE";
    return String(part).toUpperCase();
  };

  const getCategories = () => [...new Set(manuals.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));

  const previewKinds = {
    pdf: ["PDF"],
    image: ["PNG", "JPG", "JPEG", "WEBP", "GIF", "SVG"],
    html: ["HTML", "HTM"],
    text: ["TXT", "MD", "CSV", "JSON", "PINE", "PINESCRIPT", "LOG"]
  };

  const getFileType = (item) => String(item.fileType || getExtension(item.file || "")).toUpperCase();
  const isPdf = (item) => previewKinds.pdf.includes(getFileType(item));
  const isImage = (item) => previewKinds.image.includes(getFileType(item));
  const isHtml = (item) => previewKinds.html.includes(getFileType(item));
  const isText = (item) => previewKinds.text.includes(getFileType(item));
  const canInlinePreview = (item) => isPdf(item) || isImage(item) || isHtml(item) || isText(item);
  const getPdfViewerUrl = (item) => `viewer.html?file=${encodeURIComponent(item.file || "")}&title=${encodeURIComponent(item.title || "PDF 預覽")}`;

  const setSiteConfig = () => {
    const name = config.siteName || "SR+SMC+VWAP 多空雙向教練 v6.6.9";
    document.title = name;
    if (elements.siteName) elements.siteName.textContent = name;
    if (elements.footerSiteName) elements.footerSiteName.textContent = name;
    if (elements.siteSubtitle) elements.siteSubtitle.textContent = config.subtitle || "Pine Script Coaching • Strategy • Execution";
    if (elements.heroTitle) elements.heroTitle.textContent = name;
    if (elements.heroLead) elements.heroLead.textContent = config.heroLead || "集中整理教材與下載內容。";
    if (elements.siteNotice) elements.siteNotice.textContent = config.notice || "歡迎使用教練手冊下載中心。";
    if (elements.currentYear) elements.currentYear.textContent = new Date().getFullYear();
  };

  const updateDraftIndicator = () => {
    if (!elements.localDraftNotice) return;
    elements.localDraftNotice.hidden = true;
  };

  const updateStats = () => {
    const categories = getCategories();
    const dates = manuals
      .map(item => normalizeDate(item.updated))
      .filter(Boolean)
      .sort((a, b) => b - a);

    if (elements.manualCount) elements.manualCount.textContent = manuals.length;
    if (elements.categoryCount) elements.categoryCount.textContent = categories.length;
    if (elements.latestDate) {
      elements.latestDate.textContent = dates[0]
        ? new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit" }).format(dates[0])
        : "—";
    }
  };

  const renderCategoryFilters = () => {
    if (!elements.categoryFilters) return;
    const categories = ["全部", ...getCategories()];
    if (!categories.includes(state.category)) state.category = "全部";
    elements.categoryFilters.innerHTML = categories.map(category => {
      const count = category === "全部" ? manuals.length : manuals.filter(item => item.category === category).length;
      const active = state.category === category ? "is-active" : "";
      return `<button class="filter-chip ${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)} <span>${count}</span></button>`;
    }).join("");
  };

  const getFilteredManuals = () => {
    const query = state.query.trim().toLocaleLowerCase("zh-Hant");
    const filtered = manuals.filter(item => {
      const categoryMatches = state.category === "全部" || item.category === state.category;
      const searchText = [item.title, item.category, item.description, item.version, ...(item.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("zh-Hant");
      return categoryMatches && (!query || searchText.includes(query));
    });

    return filtered.sort((a, b) => {
      if (state.sort === "updated-asc") return (normalizeDate(a.updated) || 0) - (normalizeDate(b.updated) || 0);
      if (state.sort === "title-asc") return a.title.localeCompare(b.title, "zh-Hant");
      if (state.sort === "featured") {
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
          || (normalizeDate(b.updated) || 0) - (normalizeDate(a.updated) || 0);
      }
      return (normalizeDate(b.updated) || 0) - (normalizeDate(a.updated) || 0);
    });
  };

  const createManualCard = (item) => {
    const tags = (item.tags || []).slice(0, 5).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const type = getFileType(item);
    const thumbnail = item.thumbnail
      ? `<div class="manual-thumbnail"><img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}"></div>`
      : `<div class="manual-thumbnail manual-thumbnail-fallback"><span>${escapeHtml(type)}</span></div>`;
    const previewLabel = canInlinePreview(item) ? "線上預覽" : "查看詳情";
    const previewTag = isPdf(item) ? '<span class="preview-badge">PDF 可直接瀏覽</span>' : (canInlinePreview(item) ? '<span class="preview-badge">可預覽</span>' : '');

    return `
      <article class="manual-card ${item.featured ? "is-featured" : ""}">
        ${thumbnail}
        <div class="manual-card-inner">
          <div class="card-topline">
            <span class="file-badge">${escapeHtml(type)}</span>
            <div class="status-badges">
              ${previewTag}
              ${item.featured ? '<span class="status-badge featured">精選</span>' : ""}
              ${item.isNew ? '<span class="status-badge new">NEW</span>' : ""}
            </div>
          </div>
          <div class="manual-card-body">
            <p class="manual-category">${escapeHtml(item.category || "未分類")}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="manual-description">${escapeHtml(item.description || "尚未填寫說明。")}</p>
            <div class="tag-list">${tags}</div>
            <p class="usage-note"><strong>免費使用：</strong>${escapeHtml(item.license || "免費個人學習使用；禁止轉售與冒名發布")}</p>
          </div>
          <dl class="manual-meta">
            <div><dt>版本</dt><dd>${escapeHtml(item.version || "未標示")}</dd></div>
            <div><dt>更新</dt><dd>${escapeHtml(formatDate(item.updated))}</dd></div>
            <div><dt>大小</dt><dd>${escapeHtml(item.size || "未標示")}</dd></div>
          </dl>
          <div class="manual-actions">
            <button class="button button-secondary detail-button" type="button" data-id="${escapeHtml(item.id)}">${previewLabel}</button>
            <a class="button button-primary download-button" href="${escapeHtml(item.file)}" data-title="${escapeHtml(item.title)}">免費下載</a>
          </div>
        </div>
      </article>`;
  };

  const renderManuals = () => {
    if (!elements.manualGrid || !elements.resultSummary) return;
    const visible = getFilteredManuals();
    elements.manualGrid.innerHTML = visible.map(createManualCard).join("");
    elements.resultSummary.textContent = `共 ${manuals.length} 筆資料，目前顯示 ${visible.length} 筆`;
    if (elements.emptyState) elements.emptyState.hidden = visible.length > 0;
    elements.manualGrid.hidden = visible.length === 0;
  };

  const buildPreviewMedia = (item) => {
    const safeTitle = escapeHtml(item.title || "檔案預覽");
    const safeFile = escapeHtml(item.file || "");
    if (isPdf(item)) {
      return `
        <div class="preview-media-shell">
          <iframe class="preview-iframe" src="${safeFile}#view=FitH" title="${safeTitle} PDF 預覽"></iframe>
          <p class="preview-helper">此處直接顯示你放在 docs/files 的 PDF。若檔案已由本機工具寫入永久浮水印，預覽與下載都會保留該浮水印。</p>
        </div>`;
    }
    if (isImage(item)) {
      return `
        <div class="preview-media-shell image-preview-shell">
          <img class="preview-image" src="${safeFile}" alt="${safeTitle}">
        </div>`;
    }
    if (isHtml(item) || isText(item)) {
      return `
        <div class="preview-media-shell">
          <iframe class="preview-iframe" src="${safeFile}" title="${safeTitle} 預覽"></iframe>
          <p class="preview-helper">此類型可直接在網站內瀏覽內容；若樣式受瀏覽器限制，可改用新分頁開啟。</p>
        </div>`;
    }
    return `
      <div class="preview-fallback">
        <div class="preview-fallback-icon">${escapeHtml(getFileType(item))}</div>
        <h3>此檔案暫不支援站內預覽</h3>
        <p>目前可直接預覽的類型包含 PDF、圖片、HTML 與文字檔。ZIP 或其他封裝檔案請直接下載使用。</p>
      </div>`;
  };

  const showDetail = (id) => {
    const item = manuals.find(manual => String(manual.id) === String(id));
    if (!item || !elements.detailDialog || !elements.dialogContent) return;
    const tags = (item.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const previewMarkup = buildPreviewMedia(item);
    const onlinePreviewText = canInlinePreview(item)
      ? (isPdf(item) ? "此 PDF 直接從 docs/files 載入瀏覽。" : "此檔案支援站內預覽。")
      : "此檔案類型不支援站內預覽，可查看資訊後直接下載。";

    elements.dialogContent.innerHTML = `
      <div class="preview-layout">
        <section class="preview-panel preview-media-panel">
          <div class="preview-panel-head">
            <span class="dialog-file-badge">${escapeHtml(getFileType(item))}</span>
            <span class="preview-panel-note">${onlinePreviewText}</span>
          </div>
          ${previewMarkup}
        </section>

        <aside class="preview-panel preview-info-panel">
          <p class="manual-category">${escapeHtml(item.category || "未分類")}</p>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="dialog-description">${escapeHtml(item.description || "尚未填寫說明。")}</p>
          <div class="tag-list">${tags}</div>
          <div class="preview-license-box"><strong>免費使用：</strong>${escapeHtml(item.license || "免費個人學習使用；禁止轉售與冒名發布")}</div>
          <dl class="dialog-meta preview-meta-grid">
            <div><dt>版本</dt><dd>${escapeHtml(item.version || "未標示")}</dd></div>
            <div><dt>更新日期</dt><dd>${escapeHtml(formatDate(item.updated))}</dd></div>
            <div><dt>檔案大小</dt><dd>${escapeHtml(item.size || "未標示")}</dd></div>
            <div><dt>檔案類型</dt><dd>${escapeHtml(getFileType(item))}</dd></div>
            <div><dt>內容來源</dt><dd>${escapeHtml(item.source || "未標示")}</dd></div>
            <div><dt>檔案路徑</dt><dd><code>${escapeHtml(item.file)}</code></dd></div>
          </dl>
          ${item.sourceUrl ? `<p class="source-link"><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看來源或授權說明</a></p>` : ""}
          <div class="preview-actions">
            <button class="button button-secondary inline-open-button" type="button" data-url="${escapeHtml(item.file)}" data-viewer-url="${isPdf(item) ? escapeHtml(getPdfViewerUrl(item)) : ""}" data-pdf="${isPdf(item) ? "true" : "false"}">${isPdf(item) ? "PDF 預覽頁" : "新分頁開啟"}</button>
            <a class="button button-primary download-button" href="${escapeHtml(item.file)}" data-title="${escapeHtml(item.title)}">免費下載</a>
          </div>
        </aside>
      </div>`;
    elements.detailDialog.showModal();
  };

  const hasAcceptedLegalNotice = () => localStorage.getItem("manualHubLegalAccepted") === legalVersion;

  const sanitizeFilename = (name = "download") => String(name)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "download";

  const downloadBlob = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  };

  const DEFAULT_WATERMARK_SETTINGS = Object.freeze({
    mainScale: 0.95,
    cornerScale: 0.71,
    opacity: 0.28,
    inset: 0.29,
    topLeftXInset: 0.05,
    bottomRightXInset: 0.05,
    copyrightText: "內容版權所有",
    backgroundMode: "none",
    backgroundOpacity: 0.12,
    backgroundImageDataUrl: "",
    angle: 45,
  });

  const normalizeWatermarkSettings = (settings = {}) => ({
    mainScale: Math.min(1.60, Math.max(0.70, Number(settings.mainScale) || DEFAULT_WATERMARK_SETTINGS.mainScale)),
    cornerScale: Math.min(1.25, Math.max(0.45, Number(settings.cornerScale) || DEFAULT_WATERMARK_SETTINGS.cornerScale)),
    opacity: Math.min(0.45, Math.max(0.08, Number(settings.opacity) || DEFAULT_WATERMARK_SETTINGS.opacity)),
    inset: Math.min(0.32, Math.max(0.08, Number(settings.inset) || DEFAULT_WATERMARK_SETTINGS.inset)),
    topLeftXInset: Math.min(0.20, Math.max(0.00, Number.isFinite(Number(settings.topLeftXInset)) ? Number(settings.topLeftXInset) : DEFAULT_WATERMARK_SETTINGS.topLeftXInset)),
    bottomRightXInset: Math.min(0.20, Math.max(0.00, Number.isFinite(Number(settings.bottomRightXInset)) ? Number(settings.bottomRightXInset) : DEFAULT_WATERMARK_SETTINGS.bottomRightXInset)),
    copyrightText: String(settings.copyrightText || DEFAULT_WATERMARK_SETTINGS.copyrightText).trim().slice(0, 80) || DEFAULT_WATERMARK_SETTINGS.copyrightText,
    backgroundMode: ["none", "noise", "fibers", "image"].includes(String(settings.backgroundMode || "").toLowerCase()) ? String(settings.backgroundMode).toLowerCase() : DEFAULT_WATERMARK_SETTINGS.backgroundMode,
    backgroundOpacity: Math.min(0.35, Math.max(0.00, Number.isFinite(Number(settings.backgroundOpacity)) ? Number(settings.backgroundOpacity) : DEFAULT_WATERMARK_SETTINGS.backgroundOpacity)),
    backgroundImageDataUrl: String(settings.backgroundImageDataUrl || "").trim(),
    angle: 45,
  });

  const dataUrlToUint8Array = (dataUrl) => {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  };


  let watermarkBackgroundImageDataUrl = "";

  const WATERMARK_BACKGROUND_LABELS = Object.freeze({
    none: "關閉",
    noise: "躁點",
    fibers: "毛絮",
    image: "照片",
  });

  const seededRandomFactory = (seedSource = "wm") => {
    let seed = 0;
    const source = String(seedSource || "wm");
    for (let index = 0; index < source.length; index += 1) {
      seed = (seed * 31 + source.charCodeAt(index)) >>> 0;
    }
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  };

  const loadImageDataUrl = (file, maxDimension = 1600, quality = 0.72) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("無法讀取背景圖片"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("背景圖片格式不支援"));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("瀏覽器無法處理背景圖片"));
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });

  const drawCoverImage = (context, image, width, height) => {
    const imageRatio = image.width / image.height;
    const targetRatio = width / height;
    let drawWidth;
    let drawHeight;
    let drawX;
    let drawY;
    if (imageRatio > targetRatio) {
      drawHeight = height;
      drawWidth = height * imageRatio;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imageRatio;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    }
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  const createWatermarkBackgroundDataUrl = (settings, seedText = "") => {
    const normalized = normalizeWatermarkSettings(settings);
    if (normalized.backgroundMode === "none") return "";
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = 1697;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return "";

    const random = seededRandomFactory(`${normalized.backgroundMode}|${seedText}|${normalized.copyrightText}`);
    context.clearRect(0, 0, width, height);

    if (normalized.backgroundMode === "image" && normalized.backgroundImageDataUrl) {
      const image = new Image();
      image.src = normalized.backgroundImageDataUrl;
      if (image.complete && image.naturalWidth > 0) {
        context.save();
        context.filter = "grayscale(1) contrast(1.05) brightness(1.04) saturate(0)";
        drawCoverImage(context, image, width, height);
        context.restore();
        convertPhotoToTransparentTexture(context, width, height);
      }
    }

    if (normalized.backgroundMode === "noise") {
      const dotCount = 2200;
      for (let i = 0; i < dotCount; i += 1) {
        const x = random() * width;
        const y = random() * height;
        const radius = 0.25 + random() * 1.7;
        const shade = 138 + Math.floor(random() * 62);
        const alpha = 0.08 + random() * 0.28;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
        context.fill();
      }
      for (let i = 0; i < 18; i += 1) {
        const x = random() * width;
        const y = random() * height;
        const r = 20 + random() * 90;
        const gradient = context.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(150,150,150,${0.05 + random() * 0.05})`);
        gradient.addColorStop(1, "rgba(150,150,150,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
      }
    }

    if (normalized.backgroundMode === "fibers") {
      const fiberCount = 120;
      context.lineCap = "round";
      for (let i = 0; i < fiberCount; i += 1) {
        const x1 = random() * width;
        const y1 = random() * height;
        const x2 = x1 + (random() - 0.5) * 180;
        const y2 = y1 + (random() - 0.5) * 180;
        const cx = (x1 + x2) / 2 + (random() - 0.5) * 50;
        const cy = (y1 + y2) / 2 + (random() - 0.5) * 50;
        context.beginPath();
        context.moveTo(x1, y1);
        context.quadraticCurveTo(cx, cy, x2, y2);
        const shade = 150 + Math.floor(random() * 50);
        context.strokeStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.13 + random() * 0.12})`;
        context.lineWidth = 0.5 + random() * 2.2;
        context.stroke();
      }
      for (let i = 0; i < 380; i += 1) {
        const x = random() * width;
        const y = random() * height;
        const w = 1 + random() * 4;
        const h = 0.4 + random() * 2;
        context.save();
        context.translate(x, y);
        context.rotate(random() * Math.PI);
        context.fillStyle = `rgba(168,168,168,${0.07 + random() * 0.08})`;
        context.fillRect(-w / 2, -h / 2, w, h);
        context.restore();
      }
    }

    return canvas.toDataURL("image/png");
  };

  const convertPhotoToTransparentTexture = (context, width, height) => {
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const darkness = Math.max(0, Math.min(255, (246 - luminance) * 1.35));
      pixels[index] = 78;
      pixels[index + 1] = 86;
      pixels[index + 2] = 101;
      pixels[index + 3] = Math.round(darkness);
    }
    context.putImageData(imageData, 0, 0);
  };

  const createWatermarkBackgroundPng = async (settings, seedText = "") => {
    const normalized = normalizeWatermarkSettings(settings);
    if (normalized.backgroundMode === "none") return null;
    if (normalized.backgroundMode === "image" && normalized.backgroundImageDataUrl) {
      const canvas = document.createElement("canvas");
      const width = 1200;
      const height = 1697;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = normalized.backgroundImageDataUrl;
      });
      context.save();
      context.filter = "grayscale(1) contrast(1.05) brightness(1.04) saturate(0)";
      drawCoverImage(context, image, width, height);
      context.restore();
      convertPhotoToTransparentTexture(context, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      return { bytes: dataUrlToUint8Array(dataUrl), dataUrl };
    }
    const dataUrl = createWatermarkBackgroundDataUrl(normalized, seedText);
    if (!dataUrl) return null;
    return { bytes: dataUrlToUint8Array(dataUrl), dataUrl };
  };

  const applyPreviewBackgroundTexture = (settings, seedText = "") => {
    if (!elements.watermarkPreviewTexture) return;
    const dataUrl = createWatermarkBackgroundDataUrl(settings, seedText);
    elements.watermarkPreviewTexture.style.backgroundImage = dataUrl ? `url(${JSON.stringify('')})` : "none";
  };


  const splitWatermarkLines = (textValue) => {
    const [rawTitle, rawCopyright = "內容版權所有"] = String(textValue || "").split("｜");
    return [rawTitle || "教練手冊", rawCopyright || "內容版權所有"];
  };

  const createWatermarkPng = (textValue) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法建立浮水印畫布");

    const lines = splitWatermarkLines(textValue);
    const fontSize = 104;
    const copyrightSize = 88;
    const lineHeight = 122;
    const paddingX = 100;
    const paddingY = 72;
    const fontFamily = '"Microsoft JhengHei", "Noto Sans TC", "PingFang TC", sans-serif';

    let maxWidth = 0;
    lines.forEach((line, index) => {
      const size = index === lines.length - 1 ? copyrightSize : fontSize;
      context.font = `900 ${size}px ${fontFamily}`;
      maxWidth = Math.max(maxWidth, context.measureText(line).width);
    });

    canvas.width = Math.min(3600, Math.max(1100, Math.ceil(maxWidth + paddingX * 2)));
    canvas.height = Math.ceil(lines.length * lineHeight + paddingY * 2);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(70, 78, 94, 0.86)";

    const contentHeight = lines.length * lineHeight;
    const startY = (canvas.height - contentHeight) / 2 + lineHeight / 2;
    lines.forEach((line, index) => {
      const size = index === lines.length - 1 ? copyrightSize : fontSize;
      context.font = `900 ${size}px ${fontFamily}`;
      context.fillText(line, canvas.width / 2, startY + index * lineHeight);
    });

    return {
      bytes: dataUrlToUint8Array(canvas.toDataURL("image/png")),
      aspectRatio: canvas.height / canvas.width,
    };
  };

  const drawWatermarkAt = ({ page, watermarkImage, watermarkData, scale, opacity, inset, topLeftXInset, bottomRightXInset, position, degrees }) => {
    const { width, height } = page.getSize();
    const angle = Math.PI / 4;
    let imageWidth = width * scale;
    let imageHeight = imageWidth * watermarkData.aspectRatio;

    const getBounds = () => ({
      bboxWidth: imageWidth * Math.cos(angle) + imageHeight * Math.sin(angle),
      bboxHeight: imageWidth * Math.sin(angle) + imageHeight * Math.cos(angle),
    });

    let { bboxWidth, bboxHeight } = getBounds();
    const horizontalInset = position === "top-left" ? (Number.isFinite(Number(topLeftXInset)) ? Number(topLeftXInset) : inset) : (position === "bottom-right" ? (Number.isFinite(Number(bottomRightXInset)) ? Number(bottomRightXInset) : inset) : inset);
    const maxWidth = width * (position === "center" ? 0.98 : (1 - Math.max(inset, horizontalInset) * 1.20));
    const maxHeight = height * (position === "center" ? 0.74 : 0.48);
    const fit = Math.min(1, maxWidth / bboxWidth, maxHeight / bboxHeight);
    imageWidth *= fit;
    imageHeight *= fit;
    ({ bboxWidth, bboxHeight } = getBounds());

    const hSin = imageHeight * Math.sin(angle);
    const wCos = imageWidth * Math.cos(angle);
    let x;
    let y;

    if (position === "top-left") {
      const left = width * (Number.isFinite(Number(topLeftXInset)) ? Number(topLeftXInset) : inset);
      const top = height * (1 - inset);
      x = left + hSin;
      y = top - bboxHeight;
    } else if (position === "bottom-right") {
      const right = width * (1 - (Number.isFinite(Number(bottomRightXInset)) ? Number(bottomRightXInset) : inset));
      const bottom = height * inset;
      x = right - wCos;
      y = bottom;
    } else {
      x = width / 2 - (wCos - hSin) / 2;
      y = height / 2 - bboxHeight / 2;
    }

    page.drawImage(watermarkImage, {
      x,
      y,
      width: imageWidth,
      height: imageHeight,
      rotate: degrees(45),
      opacity,
    });
  };

  const drawBackgroundTextureAt = ({ page, backgroundImage, opacity }) => {
    const { width, height } = page.getSize();
    page.drawImage(backgroundImage, { x: 0, y: 0, width, height, opacity });
  };

  const applyPermanentWatermark = async (pdfBytes, title, rawSettings = {}) => {
    if (!window.PDFLib) throw new Error("PDF 處理元件尚未載入，請重新整理頁面");
    const { PDFDocument, degrees } = window.PDFLib;
    const settings = normalizeWatermarkSettings(rawSettings);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
    const watermarkText = `${title}｜${settings.copyrightText}`;
    const watermarkData = createWatermarkPng(watermarkText);
    const watermarkImage = await pdfDoc.embedPng(watermarkData.bytes);
    const backgroundData = await createWatermarkBackgroundPng(settings, title);
    const backgroundImage = backgroundData ? await pdfDoc.embedPng(backgroundData.bytes) : null;

    for (const page of pdfDoc.getPages()) {
      if (backgroundImage && settings.backgroundMode !== "none") {
        drawBackgroundTextureAt({ page, backgroundImage, opacity: settings.backgroundOpacity });
      }
      drawWatermarkAt({ page, watermarkImage, watermarkData, scale: settings.mainScale, opacity: settings.opacity, inset: settings.inset, topLeftXInset: settings.topLeftXInset, bottomRightXInset: settings.bottomRightXInset, position: "center", degrees });
      drawWatermarkAt({ page, watermarkImage, watermarkData, scale: settings.cornerScale, opacity: settings.opacity * 0.82, inset: settings.inset, topLeftXInset: settings.topLeftXInset, bottomRightXInset: settings.bottomRightXInset, position: "top-left", degrees });
      drawWatermarkAt({ page, watermarkImage, watermarkData, scale: settings.cornerScale, opacity: settings.opacity * 0.82, inset: settings.inset, topLeftXInset: settings.topLeftXInset, bottomRightXInset: settings.bottomRightXInset, position: "bottom-right", degrees });
    }
    return pdfDoc.save({ useObjectStreams: true });
  };

  const buildWatermarkedPdfBlob = async (url, title = "PDF 預覽") => {
    const target = new URL(url, window.location.href);
    const response = await fetch(target.href, { cache: "no-store" });
    if (!response.ok) throw new Error(`PDF 讀取失敗（${response.status}）`);
    const bytes = await response.arrayBuffer();
    const watermarkedBytes = await applyPermanentWatermark(bytes, title, config.watermark || DEFAULT_WATERMARK_SETTINGS);
    return new Blob([watermarkedBytes], { type: "application/pdf" });
  };

  const createWatermarkedPdf = async (url, title = "PDF 預覽") => {
    const blob = await buildWatermarkedPdfBlob(url, title);
    const filename = `${sanitizeFilename(title)}_浮水印版.pdf`;
    downloadBlob(blob, filename);
    return true;
  };

  const clearActivePreviewObjectUrl = () => {
    if (!activePreviewObjectUrl) return;
    URL.revokeObjectURL(activePreviewObjectUrl);
    activePreviewObjectUrl = null;
  };

  const loadPdfPreview = async (item) => {
    const iframe = elements.dialogContent?.querySelector("iframe.preview-iframe");
    if (!iframe || !item?.file) return;
    iframe.src = `${item.file}#view=FitH`;
  };

  const startDownload = async (url, title = "") => {
    if (!url) return;
    const target = new URL(url, window.location.href);
    const anchor = document.createElement("a");
    anchor.href = target.href;
    anchor.rel = "noopener noreferrer";
    if (target.origin === window.location.origin) {
      anchor.download = title ? `${sanitizeFilename(title)}.pdf` : "";
    } else {
      anchor.target = "_blank";
    }
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const requestDownload = (url, title = "") => {
    pendingDownload = { url, title };
    if (hasAcceptedLegalNotice() || !elements.downloadDialog) {
      startDownload(url, title);
      pendingDownload = null;
      return;
    }
    elements.detailDialog?.close();
    if (elements.downloadAgreement) elements.downloadAgreement.checked = false;
    if (elements.confirmDownload) elements.confirmDownload.disabled = true;
    elements.downloadDialog.showModal();
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("manualHubTheme", theme);
    if (elements.themeToggle) elements.themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  };

  const initTheme = () => {
    const saved = localStorage.getItem("manualHubTheme");
    const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved || preferred);
  };

  const updateHeroCarousel = (index) => {
    const count = elements.heroSlides.length;
    if (!count) return;
    state.carouselIndex = (index + count) % count;
    elements.heroSlides.forEach((slide, idx) => slide.classList.toggle("is-active", idx === state.carouselIndex));
    elements.heroDots.forEach((dot, idx) => dot.classList.toggle("is-active", idx === state.carouselIndex));
  };

  const startHeroCarousel = () => {
    if (carouselTimer || elements.heroSlides.length <= 1) return;
    carouselTimer = window.setInterval(() => updateHeroCarousel(state.carouselIndex + 1), 4200);
  };

  const stopHeroCarousel = () => {
    if (!carouselTimer) return;
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  };

  const initHeroCarousel = () => {
    if (!elements.heroCarousel || !elements.heroSlides.length) return;
    updateHeroCarousel(0);
    startHeroCarousel();

    elements.heroPrev?.addEventListener("click", () => {
      stopHeroCarousel();
      updateHeroCarousel(state.carouselIndex - 1);
      startHeroCarousel();
    });

    elements.heroNext?.addEventListener("click", () => {
      stopHeroCarousel();
      updateHeroCarousel(state.carouselIndex + 1);
      startHeroCarousel();
    });

    elements.heroDotsWrap?.addEventListener("click", (event) => {
      const dot = event.target.closest(".hero-dot");
      if (!dot) return;
      const index = elements.heroDots.indexOf(dot);
      if (index < 0) return;
      stopHeroCarousel();
      updateHeroCarousel(index);
      startHeroCarousel();
    });

    elements.heroCarousel.addEventListener("mouseenter", stopHeroCarousel);
    elements.heroCarousel.addEventListener("mouseleave", startHeroCarousel);
  };

  const refreshAll = () => {
    manuals = getManualSource();
    updateDraftIndicator();
    updateStats();
    renderCategoryFilters();
    renderManuals();
  };

  elements.searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderManuals();
  });

  elements.sortSelect?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderManuals();
  });

  elements.categoryFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderCategoryFilters();
    renderManuals();
  });

  elements.manualGrid?.addEventListener("click", (event) => {
    const detailButton = event.target.closest(".detail-button");
    if (detailButton) showDetail(detailButton.dataset.id);
  });

  document.addEventListener("click", (event) => {
    const downloadButton = event.target.closest(".download-button");
    if (downloadButton) {
      event.preventDefault();
      requestDownload(downloadButton.getAttribute("href"), downloadButton.dataset.title || "");
      return;
    }

    const inlineOpenButton = event.target.closest(".inline-open-button");
    if (inlineOpenButton) {
      const isPdfPreview = inlineOpenButton.dataset.pdf === "true";
      const url = isPdfPreview ? inlineOpenButton.dataset.viewerUrl : inlineOpenButton.dataset.url;
      if (!url) return;
      window.open(new URL(url, window.location.href).href, "_blank", "noopener,noreferrer");
    }
  });

  elements.downloadAgreement?.addEventListener("change", () => {
    if (elements.confirmDownload) elements.confirmDownload.disabled = !elements.downloadAgreement.checked;
  });

  elements.cancelDownload?.addEventListener("click", () => {
    pendingDownload = null;
    elements.downloadDialog?.close();
  });

  elements.confirmDownload?.addEventListener("click", () => {
    if (!elements.downloadAgreement?.checked || !pendingDownload) return;
    localStorage.setItem("manualHubLegalAccepted", legalVersion);
    const { url, title } = pendingDownload;
    pendingDownload = null;
    elements.downloadDialog?.close();
    startDownload(url, title);
  });

  elements.downloadDialog?.addEventListener("click", (event) => {
    if (event.target === elements.downloadDialog) {
      pendingDownload = null;
      elements.downloadDialog.close();
    }
  });

  elements.resetFilters?.addEventListener("click", () => {
    state.query = "";
    state.category = "全部";
    state.sort = "updated-desc";
    if (elements.searchInput) elements.searchInput.value = "";
    if (elements.sortSelect) elements.sortSelect.value = "updated-desc";
    renderCategoryFilters();
    renderManuals();
  });

  elements.themeToggle?.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  elements.dialogClose?.addEventListener("click", () => { clearActivePreviewObjectUrl(); elements.detailDialog.close(); });
  elements.detailDialog?.addEventListener("click", (event) => {
    if (event.target === elements.detailDialog) { clearActivePreviewObjectUrl(); elements.detailDialog.close(); }
  });

  setSiteConfig();
  initTheme();
  refreshAll();
  initHeroCarousel();
})();
