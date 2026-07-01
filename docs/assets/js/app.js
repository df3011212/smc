(() => {
  "use strict";

  const isEnglish = (window.SR_SITE_LANGUAGE || document.documentElement.lang || "").toLowerCase().startsWith("en");
  const tr = (zh, en) => isEnglish ? en : zh;
  const localizeManual = (item = {}) => isEnglish ? {
    ...item,
    title: item.titleEn || item.title,
    category: item.categoryEn || item.category,
    description: item.descriptionEn || item.description,
    license: item.licenseEn || item.license,
    source: item.sourceEn || item.source,
    tags: Array.isArray(item.tagsEn) && item.tagsEn.length ? item.tagsEn : item.tags,
  } : { ...item };
  const getManualSource = () => (Array.isArray(window.MANUALS) ? window.MANUALS.map(localizeManual) : []);

  let manuals = getManualSource();
  const config = window.SITE_CONFIG || {};

  const elements = {
    siteName: document.querySelector("#siteName"),
    footerSiteName: document.querySelector("#footerSiteName"),
    siteSubtitle: document.querySelector("#siteSubtitle"),
    modernHeroEyebrow: document.querySelector("#modernHeroEyebrow"),
    heroTitle: document.querySelector("#heroTitle"),
    heroLead: document.querySelector("#heroLead"),
    modernHeroPills: document.querySelector("#modernHeroPills"),
    modernHeroActions: document.querySelector("#modernHeroActions"),
    modernHeroCarouselEyebrow: document.querySelector("#modernHeroCarouselEyebrow"),
    modernHeroCarouselTitle: document.querySelector("#modernHeroCarouselTitle"),
    siteNotice: document.querySelector("#siteNotice"),
    localDraftNotice: document.querySelector("#localDraftNotice"),
    manualCount: document.querySelector("#manualCount"),
    categoryCount: document.querySelector("#categoryCount"),
    latestDate: document.querySelector("#latestDate"),
    subscriptionProgressCard: document.querySelector("#subscriptionProgressCard"),
    subscriptionProgressValue: document.querySelector("#subscriptionProgressValue"),
    subscriptionProgressPercent: document.querySelector("#subscriptionProgressPercent"),
    subscriptionProgressTrack: document.querySelector("#subscriptionProgressTrack"),
    subscriptionProgressFill: document.querySelector("#subscriptionProgressFill"),
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
    heroNext: document.querySelector("#heroNext"),
    donationButtons: document.querySelector("#donationButtons"),
    videoDialog: document.querySelector("#videoDialog"),
    videoDialogClose: document.querySelector("#videoDialogClose"),
    videoDialogTitle: document.querySelector("#videoDialogTitle"),
    videoDialogDescription: document.querySelector("#videoDialogDescription"),
    homepageVideoPlayer: document.querySelector("#homepageVideoPlayer"),
    officialLinksBar: document.querySelector(".public-link-bar"),
    officialLinksEyebrow: document.querySelector(".public-link-intro .eyebrow"),
    officialLinksTitle: document.querySelector(".public-link-intro strong"),
    officialLinksActions: document.querySelector(".public-link-actions"),
    starMainButton: document.querySelector(".star-button-primary"),
    starMainProductLink: document.querySelector(".star-product-frame"),
    starBillboardCarousel: document.querySelector("#starBillboardCarousel"),
    starBillboardControls: document.querySelector("#starBillboardControls"),
    starBillboardDots: document.querySelector("#starBillboardDots"),
    starBillboardPrev: document.querySelector("#starBillboardPrev"),
    starBillboardNext: document.querySelector("#starBillboardNext")
  };

  const state = {
    query: "",
    category: "全部",
    sort: "updated-desc",
    carouselIndex: 0,
    manualPageIndex: 0,
    starBillboardIndex: 0
  };

  const legalVersion = config.legalVersion || "2026-06-27";
  const counterSettings = {
    enabled: config.downloadCounter?.enabled !== false,
    provider: config.downloadCounter?.provider || "counterapi-v1",
    namespace: String(config.downloadCounter?.namespace || "df3011212-smc-downloads-v669").trim(),
    showOnCards: config.downloadCounter?.showOnCards !== false,
  };
  const localHosts = new Set(["", "localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  const isLocalPreview = window.location.protocol === "file:" || localHosts.has(window.location.hostname);
  let pendingDownload = null;
  let carouselTimer = null;
  let starBillboardTimer = null;
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
    if (!date) return value || tr("未設定", "Not set");
    return new Intl.DateTimeFormat(isEnglish ? "en-US" : "zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  };

  const formatHomepageUpdatedAt = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    const parts = new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23"
    }).formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
  };

  const getExtension = (path = "") => {
    const clean = path.split("?")[0].split("#")[0];
    const part = clean.includes(".") ? clean.split(".").pop() : "FILE";
    return String(part).toUpperCase();
  };

  const getCategories = () => [...new Set(manuals.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));

  const getSubscriptionProgress = () => {
    const source = config.subscriptionProgress || {};
    const rawCurrent = Number(source.current);
    const rawTarget = Number(source.target);
    const current = Number.isFinite(rawCurrent) ? Math.max(0, Math.trunc(rawCurrent)) : 0;
    const target = Number.isFinite(rawTarget) ? Math.max(1, Math.trunc(rawTarget)) : 300;
    const percent = Math.min(100, Math.max(0, (current / target) * 100));
    return { current, target, percent };
  };

  const formatSubscriptionPercent = (value) => {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
  };

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
  const getPdfViewerUrl = (item) => `viewer.html?file=${encodeURIComponent(item.file || "")}&title=${encodeURIComponent(item.title || tr("PDF 預覽", "PDF Preview"))}`;

  const DEFAULT_MODERN_HERO = Object.freeze({
    eyebrow: "Modern Corporate Training Manual",
    title: "SR+SMC+VWAP 多空雙向教練 v7.0.0",
    lead: "Support Resistance + SMC Coach + VWAP｜集中放置 PDF、Pine Script、ZIP 與教學教材，讓版本更新、下載與查找更清楚。",
    pills: ["最新版本 v7.0.0", "企業培訓手冊風", "支援 PDF 線上預覽", "GitHub Pages 靜態部署"],
    actions: [
      { label: "立即瀏覽手冊", url: "#manuals", style: "primary" },
      { label: "瀏覽文章與公告", url: "articles.html", style: "secondary" },
      { label: "使用與風險聲明", url: "legal.html", style: "ghost" }
    ],
    carouselEyebrow: "Featured Slides",
    carouselTitle: "精選手冊投影輪播",
    slides: [
      { id: "manual-slide-01", enabled: true, image: "assets/images/slide-01.png", imageAlt: "SR+SMC+VWAP 多空雙向教練 v7.0.0 封面", page: "01", title: "SR+SMC+VWAP 多空雙向教練 v7.0.0", description: "完整使用教學手冊｜主教練手冊" },
      { id: "manual-slide-02", enabled: true, image: "assets/images/slide-02.png", imageAlt: "SR + SMC 多空雙向教練實戰 K 棒情境教學手冊", page: "02", title: "實戰 K 棒情境教學手冊", description: "多單／空單核心流程與情境解析" },
      { id: "manual-slide-03", enabled: true, image: "assets/images/slide-03.png", imageAlt: "Close 歷史線型相似度驗證器教練手冊", page: "03", title: "Close 歷史線型相似度驗證器", description: "Close 路徑比對｜歷史樣本驗證與投影" },
      { id: "manual-slide-04", enabled: true, image: "assets/images/slide-04.png", imageAlt: "SMC 組合 02 RVOL 加 Open Interest 副圖教練 v2", page: "04", title: "SMC 組合 02｜RVOL + Open Interest", description: "副圖教練 v2｜新手從零到實戰完整使用說明書" }
    ]
  });

  const cleanDisplayText = (value = "") => String(value)
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\u3000/g, " ")
    .trim();
  const cleanOptionalTitle = (value = "") => {
    const cleaned = cleanDisplayText(value);
    return cleaned && !/^[\s.,，。．・·…⋯\-–—_｜|/\\:：;；'"「」『』（）()【】\[\]]+$/.test(cleaned) ? cleaned : "";
  };
  const normalizeModernHeroAction = (item = {}, fallback = {}) => ({
    label: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "label") ? item.label : fallback.label).slice(0, 50),
    url: String(Object.prototype.hasOwnProperty.call(item, "url") ? item.url : fallback.url || "#manuals").trim(),
    style: ["primary", "secondary", "ghost"].includes(item.style) ? item.style : (fallback.style || "secondary")
  });
  const normalizeModernHeroSlide = (item = {}, fallback = {}, index = 0) => ({
    id: String(item.id || fallback.id || `manual-slide-${index + 1}`).trim().slice(0, 70),
    enabled: item.enabled !== false,
    image: String(Object.prototype.hasOwnProperty.call(item, "image") ? item.image : fallback.image || "").trim(),
    imageAlt: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "imageAlt") ? item.imageAlt : fallback.imageAlt || item.title || `投影圖片 ${index + 1}`).slice(0, 180),
    page: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "page") ? item.page : fallback.page || String(index + 1).padStart(2, "0")).slice(0, 12),
    title: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "title") ? item.title : fallback.title || `投影頁 ${index + 1}`).slice(0, 120),
    description: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "description") ? item.description : fallback.description || "").slice(0, 220)
  });
  const getModernHero = () => {
    const source = config.modernHero || {};
    const actions = Array.isArray(source.actions) ? source.actions : DEFAULT_MODERN_HERO.actions;
    const slides = Array.isArray(source.slides) && source.slides.length ? source.slides : DEFAULT_MODERN_HERO.slides;
    return {
      eyebrow: cleanDisplayText(source.eyebrow || DEFAULT_MODERN_HERO.eyebrow).slice(0, 60),
      title: cleanDisplayText(source.title || DEFAULT_MODERN_HERO.title).slice(0, 140),
      lead: cleanDisplayText(source.lead || DEFAULT_MODERN_HERO.lead).slice(0, 600),
      pills: (Array.isArray(source.pills) ? source.pills : DEFAULT_MODERN_HERO.pills).map(cleanDisplayText).filter(Boolean).slice(0, 6),
      actions: actions.map((item, index) => normalizeModernHeroAction(item, DEFAULT_MODERN_HERO.actions[index] || {})).filter(item => item.label && item.url).slice(0, 4),
      carouselEyebrow: cleanDisplayText(source.carouselEyebrow || DEFAULT_MODERN_HERO.carouselEyebrow).slice(0, 60),
      carouselTitle: cleanDisplayText(source.carouselTitle || DEFAULT_MODERN_HERO.carouselTitle).slice(0, 100),
      slides: slides.map((item, index) => normalizeModernHeroSlide(item, DEFAULT_MODERN_HERO.slides[index] || {}, index)).filter(item => item.enabled && item.image).slice(0, 10)
    };
  };
  const renderModernHero = () => {
    const settings = getModernHero();
    if (elements.modernHeroEyebrow) elements.modernHeroEyebrow.textContent = settings.eyebrow;
    if (elements.heroTitle) elements.heroTitle.textContent = settings.title;
    if (elements.heroLead) elements.heroLead.textContent = settings.lead;
    if (elements.modernHeroPills) elements.modernHeroPills.innerHTML = settings.pills.map(item => `<span class="meta-pill">${escapeHtml(item)}</span>`).join("");
    if (elements.modernHeroActions) elements.modernHeroActions.innerHTML = settings.actions.map(item => `<a class="button button-${escapeHtml(item.style)}" href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a>`).join("");
    if (elements.modernHeroCarouselEyebrow) elements.modernHeroCarouselEyebrow.textContent = settings.carouselEyebrow;
    if (elements.modernHeroCarouselTitle) elements.modernHeroCarouselTitle.textContent = settings.carouselTitle;
    if (elements.heroCarousel) elements.heroCarousel.innerHTML = settings.slides.map((slide, index) => `<article class="hero-slide ${index === 0 ? "is-active" : ""}"><img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.imageAlt || slide.title)}"><div class="hero-slide-caption"><strong>${escapeHtml(slide.page || String(index + 1).padStart(2, "0"))}</strong><div><h3>${escapeHtml(slide.title)}</h3>${slide.description ? `<p>${escapeHtml(slide.description)}</p>` : ""}</div></div></article>`).join("");
    if (elements.heroDotsWrap) elements.heroDotsWrap.innerHTML = settings.slides.map((slide, index) => `<button class="hero-dot ${index === 0 ? "is-active" : ""}" type="button" aria-label="${escapeHtml(tr("切換到第", "Go to slide "))} ${index + 1} ${escapeHtml(tr("張", ""))}"></button>`).join("");
    elements.heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
    elements.heroDots = Array.from(document.querySelectorAll(".hero-dot"));
    state.carouselIndex = 0;
  };

  const DEFAULT_OFFICIAL_LINK_ITEMS = Object.freeze([
    {
      id: "main",
      role: "main",
      adminLabel: "明星看板主圖腳本",
      eyebrow: "MAIN CHART",
      enabled: true,
      kicker: "SR＋SMC＋VWAP 多空雙向教練 v7.0.0",
      title: "",
      url: "https://tw.tradingview.com/script/v9sZVYZ9/",
      image: "assets/images/sr-smc-vwap-v7-star-billboard.webp",
      imageAlt: "SR＋SMC＋VWAP 多空雙向教練 v7.0.0 圖表預覽"
    },
    {
      id: "rvol",
      role: "rvol",
      adminLabel: "RVOL 與 OI 副圖",
      eyebrow: "SMC COMBO 02",
      enabled: true,
      kicker: "SMC 組合02｜RVOL + Open Interest 副圖教練 v2",
      title: "",
      url: "https://tw.tradingview.com/script/s1XifCPs/",
      image: "assets/images/slide-04.png",
      imageAlt: "SMC 組合02 RVOL 與 Open Interest 副圖教練 v2 預覽"
    },
    {
      id: "close-pattern",
      role: "close",
      adminLabel: "Close 歷史線型相似度驗證器",
      eyebrow: "CLOSE PATTERN",
      enabled: true,
      kicker: "Close 歷史線型相似度驗證器 v1.2.2",
      title: "",
      url: "code/Close_歷史線型相似度驗證器_v1.2.2_Threads@hongshihong19.pine",
      image: "assets/images/close-pattern-validator-star-billboard.webp",
      imageAlt: "Close 歷史線型相似度驗證器 v1.2.2 預覽"
    },
    {
      id: "threads",
      role: "threads",
      adminLabel: "作者 Threads",
      eyebrow: "AUTHOR",
      enabled: true,
      kicker: "作者 Threads（@hongshihong19）",
      title: "",
      url: "https://www.threads.com/@hongshihong19",
      image: "",
      imageAlt: "Threads 作者 hongshihong19"
    }
  ]);

  const DEFAULT_OFFICIAL_LINKS = Object.freeze({
    schemaVersion: 3,
    eyebrow: "Featured Links",
    title: "SR＋SMC＋VWAP v7.0.0｜SMC 組合02｜Close 歷史線型驗證｜作者 Threads",
    items: DEFAULT_OFFICIAL_LINK_ITEMS
  });

  const normalizeOfficialLinkItem = (item = {}, fallback = {}, index = 0) => {
    const titleSource = Object.prototype.hasOwnProperty.call(item, "title") ? item.title : fallback.title;
    const rawTitle = cleanOptionalTitle(titleSource || "");
    const migratedTitle = rawTitle === "SR＋SMC＋VWAP 多空雙向教練" ? "" : rawTitle;
    return {
      id: String(item.id || fallback.id || `official-${index + 1}`).trim().slice(0, 70),
      role: String(item.role || fallback.role || "custom").trim().slice(0, 30),
      adminLabel: String(item.adminLabel || fallback.adminLabel || migratedTitle || `連結卡片 ${index + 1}`).trim().slice(0, 80),
      eyebrow: String(item.eyebrow || fallback.eyebrow || "FEATURED LINK").trim().slice(0, 40),
      enabled: item.enabled !== false,
      kicker: cleanDisplayText(Object.prototype.hasOwnProperty.call(item, "kicker") ? item.kicker : fallback.kicker || "連結卡片").slice(0, 100),
      title: migratedTitle.slice(0, 120),
      url: String(item.url || fallback.url || "").trim(),
      image: String(item.image || fallback.image || "").trim(),
      imageAlt: String(item.imageAlt || fallback.imageAlt || migratedTitle || "連結圖片").trim().slice(0, 160)
    };
  };

  const getOfficialLinks = () => {
    const source = config.officialLinks || {};
    const rawItems = Array.isArray(source.items)
      ? source.items
      : [
          normalizeOfficialLinkItem(source.main || {}, DEFAULT_OFFICIAL_LINK_ITEMS[0], 0),
          normalizeOfficialLinkItem(source.rvol || {}, DEFAULT_OFFICIAL_LINK_ITEMS[1], 1),
          normalizeOfficialLinkItem(DEFAULT_OFFICIAL_LINK_ITEMS[2], DEFAULT_OFFICIAL_LINK_ITEMS[2], 2),
          normalizeOfficialLinkItem(source.threads || {}, DEFAULT_OFFICIAL_LINK_ITEMS[3], 3)
        ];
    return {
      schemaVersion: 3,
      eyebrow: String(source.eyebrow || DEFAULT_OFFICIAL_LINKS.eyebrow).trim().slice(0, 40),
      title: String(source.title || DEFAULT_OFFICIAL_LINKS.title).trim().slice(0, 140),
      items: rawItems.map((item, index) => normalizeOfficialLinkItem(item, DEFAULT_OFFICIAL_LINK_ITEMS[index] || {}, index)).slice(0, 8)
    };
  };

  const isSafePublicLink = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return false;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(source) && !source.startsWith("//")) return true;
    try { return ["https:", "http:"].includes(new URL(source, document.baseURI || window.location.href).protocol); }
    catch { return false; }
  };

  const isSafePublicImage = (value = "") => {
    const source = String(value || "").trim();
    if (!source) return false;
    if (/^data:image\//i.test(source)) return true;
    try { return ["https:", "http:"].includes(new URL(source, document.baseURI || window.location.href).protocol); }
    catch { return false; }
  };

  const renderOfficialLinks = () => {
    const settings = getOfficialLinks();
    if (elements.officialLinksEyebrow) elements.officialLinksEyebrow.textContent = settings.eyebrow;
    if (elements.officialLinksTitle) elements.officialLinksTitle.textContent = settings.title;
    const visibleItems = settings.items.filter(item => item.enabled && isSafePublicLink(item.url));
    if (elements.officialLinksActions) {
      elements.officialLinksActions.innerHTML = visibleItems.map(item => {
        const imageMarkup = isSafePublicImage(item.image)
          ? `<span class="public-link-media"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy"></span>`
          : `<span class="public-link-media public-link-media-empty" aria-hidden="true">✦</span>`;
        const roleClass = String(item.role || "custom").replace(/[^a-z0-9_-]+/gi, "-");
        const titleMarkup = item.title ? `<strong>${escapeHtml(item.title)}</strong>` : "";
        return `<a class="public-link public-link-${escapeHtml(roleClass)} ${item.title ? "" : "is-title-empty"}" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" data-id="${escapeHtml(item.id)}">${imageMarkup}<span class="public-link-copy"><span class="public-link-kicker">${escapeHtml(item.kicker)}</span>${titleMarkup}</span><span class="public-link-arrow" aria-hidden="true">↗</span></a>`;
      }).join("");
    }
    if (elements.officialLinksBar) elements.officialLinksBar.hidden = visibleItems.length === 0;
    const mainItem = visibleItems.find(item => item.role === "main") || visibleItems[0];
    if (mainItem && isSafePublicLink(mainItem.url)) {
      if (elements.starMainButton) elements.starMainButton.href = mainItem.url;
      if (elements.starMainProductLink) elements.starMainProductLink.href = mainItem.url;
    }
  };

  const DEFAULT_STAR_BILLBOARD_PAGES = Object.freeze([
    {
      id: "star-main-v700",
      enabled: true,
      badgePrimary: "STAR INDICATOR",
      badgeSecondary: "OPEN-SOURCE",
      badgeVersion: "v7.0.0",
      kicker: "SR × SMC × VWAP｜多空雙向教練",
      title: "步驟 1～8，從結構確認到持倉管理",
      highlight: "把完整交易流程放進同一張圖表",
      lead: "整合支撐阻力、SMC、Order Block、FVG、VWAP 與多週期平行通道；v7.0.0 新增步驟 1～8 前進／退回、步驟 8 持倉管理、1H TP1～TP4／SL，以及 15M 預覽 1H 盈虧比。",
      features: ["步驟 1～8 前進／退回", "1H TP1～TP4／SL 管理", "15M 預覽 1H 盈虧比"],
      primaryLabel: "在 TradingView 查看 v7.0.0",
      primaryUrl: "https://tw.tradingview.com/script/v9sZVYZ9/",
      secondaryLabel: "下載 v7.0.0 Pine 原始碼",
      secondaryUrl: "code/SR_SMC_VWAP_v7.0.0_Threads@hongshihong19.pine",
      authorNote: "作者／著作權人：Threads（@hongshihong19）",
      image: "assets/images/sr-smc-vwap-v7-star-billboard.webp",
      imageAlt: "SR+SMC+VWAP 多空雙向教練 v7.0.0 TradingView 圖表畫面",
      ribbon: "FEATURED SCRIPT",
      captionKicker: "SR＋SMC＋VWAP",
      captionTitle: "多空雙向教練 v7.0.0"
    },
    {
      id: "star-close-pattern-v122",
      enabled: true,
      badgePrimary: "PATTERN VALIDATOR",
      badgeSecondary: "CLOSE ONLY",
      badgeVersion: "v1.2.2",
      kicker: "Close 歷史線型相似度驗證器",
      title: "把目前 Close 線型",
      highlight: "交給歷史樣本驗證",
      lead: "固定以已收盤 close[1] 為正式終點，搜尋最多 5000 根歷史資料；比較前三名彼此不重疊的相似樣本，疊合目前線型，並把歷史樣本後續 100 根 Close 路徑投影到右側。",
      features: ["只比較 Close 收盤價", "前三名獨立歷史樣本", "後續 100 根路徑投影"],
      primaryLabel: "下載 Close 驗證器 Pine",
      primaryUrl: "code/Close_歷史線型相似度驗證器_v1.2.2_Threads@hongshihong19.pine",
      secondaryLabel: "前往教練手冊下載中心",
      secondaryUrl: "#manuals",
      authorNote: "作者／著作權人：Threads（@hongshihong19）",
      image: "assets/images/close-pattern-validator-star-billboard.webp",
      imageAlt: "Close 歷史線型相似度驗證器與教練手冊整合預覽",
      ribbon: "HISTORICAL MATCH",
      captionKicker: "Close Pattern Matching",
      captionTitle: "歷史線型相似度驗證器 v1.2.2"
    }
  ]);

  const normalizeStarBillboardPage = (page = {}, index = 0) => {
    const fallback = DEFAULT_STAR_BILLBOARD_PAGES[0];
    const rawFeatures = Array.isArray(page.features)
      ? page.features
      : [page.feature1, page.feature2, page.feature3];
    return {
      id: String(page.id || `star-page-${index + 1}`),
      enabled: page.enabled !== false,
      badgePrimary: String(page.badgePrimary || fallback.badgePrimary).trim().slice(0, 32),
      badgeSecondary: String(page.badgeSecondary || fallback.badgeSecondary).trim().slice(0, 32),
      badgeVersion: String(page.badgeVersion || fallback.badgeVersion).trim().slice(0, 24),
      kicker: String(page.kicker || fallback.kicker).trim().slice(0, 90),
      title: String(page.title || fallback.title).trim().slice(0, 120),
      highlight: String(page.highlight || fallback.highlight).trim().slice(0, 120),
      lead: String(page.lead || fallback.lead).trim().slice(0, 520),
      features: rawFeatures.map(value => String(value || "").trim().slice(0, 80)).filter(Boolean).slice(0, 5),
      primaryLabel: String(page.primaryLabel || fallback.primaryLabel).trim().slice(0, 50),
      primaryUrl: String(page.primaryUrl || fallback.primaryUrl).trim(),
      secondaryLabel: String(page.secondaryLabel || fallback.secondaryLabel).trim().slice(0, 50),
      secondaryUrl: String(page.secondaryUrl || fallback.secondaryUrl).trim(),
      authorNote: String(page.authorNote || fallback.authorNote).trim().slice(0, 140),
      image: String(page.image || fallback.image).trim(),
      imageAlt: String(page.imageAlt || page.title || fallback.imageAlt).trim().slice(0, 180),
      ribbon: String(page.ribbon || fallback.ribbon).trim().slice(0, 40),
      captionKicker: String(page.captionKicker || fallback.captionKicker).trim().slice(0, 50),
      captionTitle: String(page.captionTitle || page.title || fallback.captionTitle).trim().slice(0, 80)
    };
  };

  const getStarBillboards = () => {
    const source = config.starBillboards || {};
    const rawPages = Array.isArray(source.pages) && source.pages.length ? source.pages : DEFAULT_STAR_BILLBOARD_PAGES;
    const pages = rawPages.map(normalizeStarBillboardPage).filter(page => page.enabled).slice(0, 12);
    return {
      autoplay: source.autoplay !== false,
      interval: Math.min(20000, Math.max(3000, Number(source.interval) || 6500)),
      pages: pages.length ? pages : DEFAULT_STAR_BILLBOARD_PAGES.map(normalizeStarBillboardPage)
    };
  };

  const isSafeBillboardHref = (value = "") => {
    const raw = String(value || "").trim();
    if (!raw) return false;
    if (raw.startsWith("#") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return true;
    try { return ["https:", "http:"].includes(new URL(raw, window.location.href).protocol); }
    catch { return false; }
  };

  const safeBillboardHref = (value = "", fallback = "#manuals") => isSafeBillboardHref(value) ? value : fallback;
  const safeBillboardImage = (value = "") => {
    const raw = String(value || "").trim();
    if (!raw || /^javascript:/i.test(raw)) return DEFAULT_STAR_BILLBOARD_PAGES[0].image;
    return raw;
  };
  const multilineHtml = (value = "") => escapeHtml(value).replace(/\r?\n/g, "<br>");

  const createStarBillboardSlide = (page, index) => {
    const featureMarkup = page.features.map(feature => `<span>${escapeHtml(feature)}</span>`).join("");
    const primaryExternal = /^https?:/i.test(page.primaryUrl);
    const secondaryExternal = /^https?:/i.test(page.secondaryUrl);
    return `
      <article class="star-billboard-slide" data-star-billboard-slide="${index}" aria-hidden="true">
        <div class="star-billboard-copy">
          <div class="star-billboard-badges" aria-label="明星看板特色">
            ${page.badgePrimary ? `<span class="star-badge star-badge-primary">${escapeHtml(page.badgePrimary)}</span>` : ""}
            ${page.badgeSecondary ? `<span class="star-badge">${escapeHtml(page.badgeSecondary)}</span>` : ""}
            ${page.badgeVersion ? `<span class="star-badge">${escapeHtml(page.badgeVersion)}</span>` : ""}
          </div>
          <p class="star-billboard-kicker">${escapeHtml(page.kicker)}</p>
          <h1 id="${index === 0 ? "starBillboardTitle" : `starBillboardTitle-${index}`}">${multilineHtml(page.title)}${page.highlight ? `<br><span>${multilineHtml(page.highlight)}</span>` : ""}</h1>
          <p class="star-billboard-lead">${escapeHtml(page.lead)}</p>
          ${featureMarkup ? `<div class="star-billboard-features" aria-label="核心特色">${featureMarkup}</div>` : ""}
          <div class="star-billboard-actions">
            <a class="star-button star-button-primary" href="${escapeHtml(safeBillboardHref(page.primaryUrl))}" ${primaryExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>
              <span>${escapeHtml(page.primaryLabel)}</span><b aria-hidden="true">↗</b>
            </a>
            <a class="star-button star-button-secondary" href="${escapeHtml(safeBillboardHref(page.secondaryUrl))}" ${secondaryExternal ? 'target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(page.secondaryLabel)}</a>
          </div>
          ${page.authorNote ? `<p class="star-billboard-note">${escapeHtml(page.authorNote)}</p>` : ""}
        </div>
        <div class="star-billboard-product" aria-label="${escapeHtml(page.imageAlt)}">
          <div class="star-product-halo" aria-hidden="true"></div>
          <a class="star-product-frame" href="${escapeHtml(safeBillboardHref(page.primaryUrl))}" ${primaryExternal ? 'target="_blank" rel="noopener noreferrer"' : ""} aria-label="${escapeHtml(page.primaryLabel)}">
            ${page.ribbon ? `<div class="star-product-ribbon">${escapeHtml(page.ribbon)}</div>` : ""}
            <img src="${escapeHtml(safeBillboardImage(page.image))}" alt="${escapeHtml(page.imageAlt)}">
            <div class="star-product-caption"><span>${escapeHtml(page.captionKicker)}</span><strong>${escapeHtml(page.captionTitle)}</strong></div>
          </a>
          <div class="star-product-shadow" aria-hidden="true"></div>
        </div>
      </article>`;
  };

  const stopStarBillboardAutoplay = () => {
    if (!starBillboardTimer) return;
    window.clearInterval(starBillboardTimer);
    starBillboardTimer = null;
  };

  const updateStarBillboard = (nextIndex, { restart = false } = {}) => {
    const slides = Array.from(elements.starBillboardCarousel?.querySelectorAll("[data-star-billboard-slide]") || []);
    const dots = Array.from(elements.starBillboardDots?.querySelectorAll("[data-star-billboard-dot]") || []);
    if (!slides.length) return;
    state.starBillboardIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === state.starBillboardIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    dots.forEach((dot, index) => {
      const active = index === state.starBillboardIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (restart) startStarBillboardAutoplay();
  };

  const startStarBillboardAutoplay = () => {
    stopStarBillboardAutoplay();
    const settings = getStarBillboards();
    if (!settings.autoplay || settings.pages.length <= 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    starBillboardTimer = window.setInterval(() => updateStarBillboard(state.starBillboardIndex + 1), settings.interval);
  };

  const initStarBillboards = () => {
    if (!elements.starBillboardCarousel || !elements.starBillboardDots) return;
    const settings = getStarBillboards();
    elements.starBillboardCarousel.innerHTML = settings.pages.map(createStarBillboardSlide).join("");
    elements.starBillboardDots.innerHTML = settings.pages.map((page, index) => `<button class="star-billboard-dot" type="button" role="tab" data-star-billboard-dot="${index}" aria-label="明星看板第 ${index + 1} 頁" aria-selected="false"></button>`).join("");
    if (elements.starBillboardControls) elements.starBillboardControls.hidden = settings.pages.length <= 1;
    updateStarBillboard(0);
    startStarBillboardAutoplay();
    const section = elements.starBillboardCarousel.closest(".star-billboard");
    section?.addEventListener("mouseenter", stopStarBillboardAutoplay);
    section?.addEventListener("mouseleave", startStarBillboardAutoplay);
    section?.addEventListener("focusin", stopStarBillboardAutoplay);
    section?.addEventListener("focusout", startStarBillboardAutoplay);
  };

  const DEFAULT_DONATION_LINKS = [
    { id: "ko-fi", label: "打賞／贊助", icon: "☕", url: "https://ko-fi.com/hungshiihhungsmc", enabled: true }
  ];

  const DEFAULT_HOME_VIDEOS = [
    {
      id: "patreon-subscription-tutorial",
      label: "Patreon 訂閱教學影片",
      labelEn: "Patreon Subscription Tutorial",
      icon: "▶",
      title: "Patreon 訂閱贊助教學",
      titleEn: "Patreon Subscription Tutorial",
      description: "點擊播放訂閱與贊助操作教學。影片會在目前頁面的彈出視窗中播放。",
      descriptionEn: "Watch the Patreon subscription and support tutorial in an on-page dialog.",
      src: "assets/uploads/videos/patreon-subscription-tutorial.mp4",
      enabled: true
    }
  ];

  const getPublicDonationLinks = () => {
    const source = Array.isArray(config.donations) ? config.donations : DEFAULT_DONATION_LINKS;
    return source
      .map((item, index) => ({
        id: String(item?.id || `support-${index + 1}`),
        label: String((isEnglish ? item?.labelEn : item?.label) || item?.label || `打賞平台 ${index + 1}`).trim(),
        icon: String(item?.icon || "❤").trim().slice(0, 4),
        url: String(item?.url || "").trim(),
        enabled: item?.enabled !== false,
      }))
      .filter(item => {
        if (!item.enabled || !item.label || !item.url) return false;
        try { return ["https:", "http:"].includes(new URL(item.url).protocol); } catch { return false; }
      })
      .slice(0, 12);
  };

  const normalizePublicVideo = (item = {}, index = 0) => ({
    id: String(item.id || `video-${index + 1}`),
    label: String((isEnglish ? item.labelEn : item.label) || item.label || tr(`教學影片 ${index + 1}`, `Tutorial Video ${index + 1}`)).trim(),
    icon: String(item.icon || "▶").trim().slice(0, 4),
    title: String((isEnglish ? item.titleEn : item.title) || item.title || item.label || tr("教學影片", "Tutorial Video")).trim(),
    description: String((isEnglish ? item.descriptionEn : item.description) || item.description || "").trim(),
    src: String(item.src || "").trim(),
    enabled: item.enabled !== false,
  });

  const isSafeVideoSource = (value = "") => {
    try {
      const parsed = new URL(value, document.baseURI || window.location.href);
      return ["http:", "https:"].includes(parsed.protocol) && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(parsed.pathname + parsed.search + parsed.hash);
    } catch { return false; }
  };

  const getPublicHomeVideos = () => {
    const source = Array.isArray(config.videos) ? config.videos : DEFAULT_HOME_VIDEOS;
    return source.map(normalizePublicVideo).filter(item => item.enabled && item.label && isSafeVideoSource(item.src)).slice(0, 8);
  };

  const renderDonationButtons = () => {
    if (!elements.donationButtons) return;
    const links = getPublicDonationLinks();
    const videos = getPublicHomeVideos();
    elements.donationButtons.hidden = links.length === 0 && videos.length === 0;
    const donationHtml = links.map(item => `
      <a class="button button-support donation-header-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(tr("開啟", "Open"))} ${escapeHtml(item.label)}">
        <span aria-hidden="true">${escapeHtml(item.icon || "❤")}</span>
        <span>${escapeHtml(item.label)}</span>
      </a>`).join("");
    const videoHtml = videos.map(item => `
      <button class="button button-video donation-header-button video-launch-button" type="button" data-video-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(tr("播放", "Play"))} ${escapeHtml(item.label)}">
        <span aria-hidden="true">${escapeHtml(item.icon || "▶")}</span>
        <span>${escapeHtml(item.label)}</span>
      </button>`).join("");
    elements.donationButtons.innerHTML = donationHtml + videoHtml;
  };

  const closeHomepageVideo = () => {
    const player = elements.homepageVideoPlayer;
    if (player) {
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
    if (elements.videoDialog?.open) elements.videoDialog.close();
  };

  const openHomepageVideo = (videoId) => {
    const video = getPublicHomeVideos().find(item => item.id === videoId);
    if (!video || !elements.videoDialog || !elements.homepageVideoPlayer) return;
    elements.videoDialogTitle.textContent = video.title || video.label;
    elements.videoDialogDescription.textContent = video.description || "";
    elements.videoDialogDescription.hidden = !video.description;
    elements.homepageVideoPlayer.src = new URL(video.src, window.location.href).href;
    elements.videoDialog.showModal();
    elements.homepageVideoPlayer.load();
    elements.homepageVideoPlayer.play().catch(() => {});
  };

  const setSiteConfig = () => {
    const name = isEnglish ? (config.siteNameEn || "SR+SMC+VWAP Long/Short Trading Coach v7.0.0") : (config.siteName || "SR+SMC+VWAP 多空雙向教練 v7.0.0");
    document.title = name;
    if (elements.siteName) elements.siteName.textContent = name;
    if (elements.footerSiteName) elements.footerSiteName.textContent = name;
    if (elements.siteSubtitle) elements.siteSubtitle.textContent = isEnglish ? (config.subtitleEn || "Pine Script Coaching • Strategy • Execution") : (config.subtitle || "Pine Script Coaching • Strategy • Execution");
    renderModernHero();
    if (elements.siteNotice) elements.siteNotice.textContent = isEnglish ? (config.noticeEn || "This website is for education and personal research. All content is free and is not investment advice.") : (config.notice || "歡迎使用教練手冊下載中心。");
    if (elements.currentYear) elements.currentYear.textContent = new Date().getFullYear();
    renderOfficialLinks();
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
      const configured = formatHomepageUpdatedAt(config.homeUpdatedAt);
      if (configured) {
        elements.latestDate.textContent = configured;
        elements.latestDate.title = tr("首頁更新時間（台灣時間）", "Homepage updated time (Taipei time)");
      } else if (dates[0]) {
        elements.latestDate.textContent = new Intl.DateTimeFormat(isEnglish ? "en-US" : "zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(dates[0]);
      } else {
        elements.latestDate.textContent = "—";
      }
    }

    const subscription = getSubscriptionProgress();
    const formattedCurrent = new Intl.NumberFormat(isEnglish ? "en-US" : "zh-TW").format(subscription.current);
    const formattedTarget = new Intl.NumberFormat(isEnglish ? "en-US" : "zh-TW").format(subscription.target);
    const percentText = formatSubscriptionPercent(subscription.percent);
    if (elements.subscriptionProgressValue) elements.subscriptionProgressValue.textContent = `${formattedCurrent} / ${formattedTarget}`;
    if (elements.subscriptionProgressPercent) elements.subscriptionProgressPercent.textContent = percentText;
    if (elements.subscriptionProgressFill) elements.subscriptionProgressFill.style.width = `${subscription.percent}%`;
    if (elements.subscriptionProgressTrack) {
      elements.subscriptionProgressTrack.setAttribute("aria-valuenow", String(Math.round(subscription.percent * 10) / 10));
      elements.subscriptionProgressTrack.setAttribute("aria-valuetext", `${formattedCurrent} / ${formattedTarget}，${percentText}`);
    }
  };

  const renderCategoryFilters = () => {
    if (!elements.categoryFilters) return;
    const categories = ["全部", ...getCategories()];
    if (!categories.includes(state.category)) state.category = "全部";
    elements.categoryFilters.innerHTML = categories.map(category => {
      const count = category === "全部" ? manuals.length : manuals.filter(item => item.category === category).length;
      const active = state.category === category ? "is-active" : "";
      return `<button class="filter-chip ${active}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category === "全部" ? tr("全部", "All") : category)} <span>${count}</span></button>`;
    }).join("");
  };

  const getFilteredManuals = () => {
    const query = state.query.trim().toLocaleLowerCase(isEnglish ? "en" : "zh-Hant");
    const filtered = manuals.filter(item => {
      const categoryMatches = state.category === "全部" || item.category === state.category;
      const searchText = [item.title, item.category, item.description, item.version, ...(item.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(isEnglish ? "en" : "zh-Hant");
      return categoryMatches && (!query || searchText.includes(query));
    });

    return filtered.sort((a, b) => {
      if (state.sort === "updated-asc") return (normalizeDate(a.updated) || 0) - (normalizeDate(b.updated) || 0);
      if (state.sort === "title-asc") return a.title.localeCompare(b.title, isEnglish ? "en" : "zh-Hant");
      if (state.sort === "featured") {
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
          || (normalizeDate(b.updated) || 0) - (normalizeDate(a.updated) || 0);
      }
      return (normalizeDate(b.updated) || 0) - (normalizeDate(a.updated) || 0);
    });
  };

  const getCounterName = (item = {}) => String(item.downloadCounterName || item.id || "manual")
    .trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "manual";

  const getCounterEndpoint = (item, action = "") => {
    const namespace = encodeURIComponent(counterSettings.namespace || "df3011212-smc-downloads-v669");
    const name = encodeURIComponent(getCounterName(item));
    const suffix = action ? `/${action}` : "";
    return `https://api.counterapi.dev/v1/${namespace}/${name}${suffix}`;
  };

  const parseCounterValue = (payload, fallback = 0) => {
    const candidates = [payload?.value, payload?.count, payload?.data?.value, payload?.data?.count];
    const value = candidates.map(Number).find(Number.isFinite);
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : Math.max(0, Math.trunc(Number(fallback) || 0));
  };

  const updateDownloadCountElements = (manualId, value, stateName = "loaded") => {
    document.querySelectorAll(`[data-download-count-id="${CSS.escape(String(manualId))}"]`).forEach(element => {
      element.dataset.state = stateName;
      element.textContent = new Intl.NumberFormat(isEnglish ? "en-US" : "zh-TW").format(Math.max(0, Number(value) || 0));
    });
  };

  const fetchCounter = async (item, action = "") => {
    const response = await fetch(getCounterEndpoint(item, action), { cache: "no-store", mode: "cors", keepalive: action === "up" });
    if (!response.ok) throw new Error(`Counter API ${response.status}`);
    return response.json();
  };

  const loadDownloadCount = async (item) => {
    const fallback = Math.max(0, Number(item.downloadCount) || 0);
    if (!counterSettings.enabled || !counterSettings.namespace || isLocalPreview) {
      updateDownloadCountElements(item.id, fallback, isLocalPreview ? "local" : "disabled");
      return fallback;
    }
    try {
      const payload = await fetchCounter(item);
      const value = parseCounterValue(payload, fallback);
      updateDownloadCountElements(item.id, value);
      return value;
    } catch (error) {
      console.warn("Download counter unavailable:", error);
      updateDownloadCountElements(item.id, fallback, "fallback");
      return fallback;
    }
  };

  const loadVisibleDownloadCounts = () => {
    if (!counterSettings.showOnCards) return;
    const ids = [...new Set(Array.from(document.querySelectorAll("[data-download-count-id]")).map(node => node.dataset.downloadCountId))];
    ids.forEach(id => {
      const item = manuals.find(manual => String(manual.id) === String(id));
      if (item) void loadDownloadCount(item);
    });
  };

  const incrementDownloadCounter = async (manualId) => {
    const item = manuals.find(manual => String(manual.id) === String(manualId));
    if (!item || !counterSettings.enabled || !counterSettings.namespace || isLocalPreview) return;
    try {
      const payload = await fetchCounter(item, "up");
      updateDownloadCountElements(item.id, parseCounterValue(payload, Number(item.downloadCount) || 0));
    } catch (error) {
      console.warn("Unable to increment download counter:", error);
    }
  };

  const createManualGallery = (visible) => {
    if (!visible.length) return "";
    const total = visible.length;
    const currentIndex = Math.max(0, Math.min(state.manualPageIndex, total - 1));
    const item = visible[currentIndex];
    const pageDots = visible.map((manual, index) => `
      <button class="manual-page-dot ${index === currentIndex ? "is-active" : ""}" type="button" data-manual-page="${index}" aria-label="${escapeHtml(tr("切換到第", "Go to page "))} ${index + 1} ${escapeHtml(tr("本手冊", "manual"))}" aria-current="${index === currentIndex ? "true" : "false"}">${index + 1}</button>`).join("");

    return `
      <div class="manual-gallery-shell">
        <div class="manual-gallery-head">
          <div class="manual-gallery-controls">
            <button class="manual-nav-button" type="button" data-manual-nav="prev">← ${tr("上一頁", "Previous")}</button>
            <div class="manual-page-indicator">${tr("第", "Page ")} <strong>${currentIndex + 1}</strong> / ${total} ${tr("本", "")}</div>
            <button class="manual-nav-button" type="button" data-manual-nav="next">${tr("下一頁", "Next")} →</button>
          </div>
        </div>
        <div class="manual-gallery-stage">
          ${createManualCard(item)}
        </div>
        <div class="manual-gallery-footer">
          <div class="manual-page-dots" aria-label="${escapeHtml(tr("手冊頁碼導航", "Manual page navigation"))}">${pageDots}</div>
        </div>
      </div>`;
  };

  const createManualCard = (item) => {
    const tags = (item.tags || []).slice(0, 5).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const type = getFileType(item);
    const thumbnail = item.thumbnail
      ? `<div class="manual-thumbnail"><img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}"></div>`
      : `<div class="manual-thumbnail manual-thumbnail-fallback"><span>${escapeHtml(type)}</span></div>`;
    const previewLabel = canInlinePreview(item) ? tr("線上預覽", "Online Preview") : tr("查看詳情", "View Details");
    const previewTag = isPdf(item)
      ? `<span class="preview-badge">${tr("PDF 可直接瀏覽", "PDF Preview Available")}</span>`
      : (canInlinePreview(item) ? `<span class="preview-badge">${tr("可預覽", "Preview Available")}</span>` : "");
    const countMarkup = counterSettings.showOnCards ? `
      <div class="download-count-row" title="${tr("免費下載按鈕累積點擊次數；不代表檔案完整下載完成", "Cumulative free-download button clicks; not guaranteed completed downloads")}">
        <span>${tr("累積下載", "Downloads")}</span>
        <strong data-download-count-id="${escapeHtml(item.id)}" data-state="loading">${escapeHtml(String(Math.max(0, Number(item.downloadCount) || 0)))}</strong>
        <small>${tr("次", "")}</small>
      </div>` : "";

    return `
      <article class="manual-card ${item.featured ? "is-featured" : ""}">
        ${thumbnail}
        <div class="manual-card-inner">
          <div class="card-topline">
            <span class="file-badge">${escapeHtml(type)}</span>
            <div class="status-badges">
              ${previewTag}
              ${item.featured ? `<span class="status-badge featured">${tr("精選", "Featured")}</span>` : ""}
              ${item.isNew ? '<span class="status-badge new">NEW</span>' : ""}
            </div>
          </div>
          <div class="manual-card-body">
            <p class="manual-category">${escapeHtml(item.category || tr("未分類", "Uncategorized"))}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="manual-description">${escapeHtml(item.description || tr("尚未填寫說明。", "No description provided."))}</p>
            <div class="tag-list">${tags}</div>
            <p class="usage-note"><strong>${tr("免費使用：", "Free use: ")}</strong>${escapeHtml(item.license || tr("免費個人學習使用；禁止轉售與冒名發布", "Free for personal learning; resale and impersonation are prohibited"))}</p>
          </div>
          <dl class="manual-meta">
            <div><dt>${tr("版本", "Version")}</dt><dd>${escapeHtml(item.version || tr("未標示", "Not specified"))}</dd></div>
            <div><dt>${tr("更新", "Updated")}</dt><dd>${escapeHtml(formatDate(item.updated))}</dd></div>
            <div><dt>${tr("大小", "Size")}</dt><dd>${escapeHtml(item.size || tr("未標示", "Not specified"))}</dd></div>
          </dl>
          ${countMarkup}
          <div class="manual-actions">
            <button class="button button-secondary detail-button" type="button" data-id="${escapeHtml(item.id)}">${previewLabel}</button>
            <a class="button button-primary download-button" href="${escapeHtml(item.file)}" data-id="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}">${tr("免費下載", "Free Download")}</a>
          </div>
        </div>
      </article>`;
  };

  const renderManuals = () => {
    if (!elements.manualGrid || !elements.resultSummary) return;
    const visible = getFilteredManuals();
    if (visible.length === 0) {
      state.manualPageIndex = 0;
      elements.manualGrid.innerHTML = "";
    } else if (state.manualPageIndex >= visible.length) {
      state.manualPageIndex = visible.length - 1;
    } else if (state.manualPageIndex < 0) {
      state.manualPageIndex = 0;
    }

    elements.manualGrid.innerHTML = visible.length ? createManualGallery(visible) : "";
    elements.resultSummary.textContent = visible.length
      ? (isEnglish ? `${manuals.length} items total · showing page ${state.manualPageIndex + 1} of ${visible.length}` : `共 ${manuals.length} 筆資料，目前顯示第 ${state.manualPageIndex + 1} / ${visible.length} 本`)
      : (isEnglish ? `${manuals.length} items total; showing 0` : `共 ${manuals.length} 筆資料，目前顯示 0 筆`);
    loadVisibleDownloadCounts();
    if (elements.emptyState) elements.emptyState.hidden = visible.length > 0;
    elements.manualGrid.hidden = visible.length === 0;
  };

  const buildPreviewMedia = (item) => {
    const safeTitle = escapeHtml(item.title || tr("檔案預覽", "File Preview"));
    const safeFile = escapeHtml(item.file || "");
    if (isPdf(item)) {
      return `<div class="preview-media-shell"><iframe class="preview-iframe" src="${safeFile}#view=FitH" title="${safeTitle} ${tr("PDF 預覽", "PDF Preview")}"></iframe><p class="preview-helper">${tr("此處直接顯示你放在 docs/files 的 PDF。若檔案已由本機工具寫入永久浮水印，預覽與下載都會保留該浮水印。", "This directly displays the PDF stored in docs/files. If a permanent watermark was embedded by the local tool, it remains in previews and downloads.")}</p></div>`;
    }
    if (isImage(item)) return `<div class="preview-media-shell image-preview-shell"><img class="preview-image" src="${safeFile}" alt="${safeTitle}"></div>`;
    if (isHtml(item) || isText(item)) {
      return `<div class="preview-media-shell"><iframe class="preview-iframe" src="${safeFile}" title="${safeTitle} ${tr("預覽", "Preview")}"></iframe><p class="preview-helper">${tr("此類型可直接在網站內瀏覽內容；若樣式受瀏覽器限制，可改用新分頁開啟。", "This file can be viewed on the site. Open it in a new tab if browser restrictions affect formatting.")}</p></div>`;
    }
    return `<div class="preview-fallback"><div class="preview-fallback-icon">${escapeHtml(getFileType(item))}</div><h3>${tr("此檔案暫不支援站內預覽", "Inline Preview Not Available")}</h3><p>${tr("目前可直接預覽的類型包含 PDF、圖片、HTML 與文字檔。ZIP 或其他封裝檔案請直接下載使用。", "PDFs, images, HTML, and text files can be previewed. Download ZIP or other packaged files directly.")}</p></div>`;
  };

  const triggerPreviewDreamOpening = () => {
    if (!elements.detailDialog) return;
    elements.detailDialog.classList.remove("is-opening");
    void elements.detailDialog.offsetWidth;
    window.requestAnimationFrame(() => {
      elements.detailDialog?.classList.add("is-opening");
      window.setTimeout(() => elements.detailDialog?.classList.remove("is-opening"), 1400);
    });
  };

  const showDetail = (id) => {
    const item = manuals.find(manual => String(manual.id) === String(id));
    if (!item || !elements.detailDialog || !elements.dialogContent) return;
    const tags = (item.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
    const previewMarkup = buildPreviewMedia(item);
    const onlinePreviewText = canInlinePreview(item)
      ? (isPdf(item) ? tr("此 PDF 直接從 docs/files 載入瀏覽。", "This PDF is loaded directly from docs/files.") : tr("此檔案支援站內預覽。", "This file supports inline preview."))
      : tr("此檔案類型不支援站內預覽，可查看資訊後直接下載。", "This file type cannot be previewed here; review its details and download it directly.");
    const countMarkup = counterSettings.showOnCards ? `<div class="download-count-row download-count-dialog"><span>${tr("累積下載", "Downloads")}</span><strong data-download-count-id="${escapeHtml(item.id)}" data-state="loading">${escapeHtml(String(Math.max(0, Number(item.downloadCount) || 0)))}</strong><small>${tr("次", "")}</small></div>` : "";

    elements.dialogContent.innerHTML = `
      <div class="preview-layout">
        <section class="preview-panel preview-media-panel"><div class="preview-panel-head"><span class="dialog-file-badge">${escapeHtml(getFileType(item))}</span><span class="preview-panel-note">${onlinePreviewText}</span></div>${previewMarkup}</section>
        <aside class="preview-panel preview-info-panel">
          <p class="manual-category">${escapeHtml(item.category || tr("未分類", "Uncategorized"))}</p>
          <h2>${escapeHtml(item.title)}</h2>
          <p class="dialog-description">${escapeHtml(item.description || tr("尚未填寫說明。", "No description provided."))}</p>
          <div class="tag-list">${tags}</div>
          <div class="preview-license-box"><strong>${tr("免費使用：", "Free use: ")}</strong>${escapeHtml(item.license || tr("免費個人學習使用；禁止轉售與冒名發布", "Free for personal learning; resale and impersonation are prohibited"))}</div>
          <dl class="dialog-meta preview-meta-grid">
            <div><dt>${tr("版本", "Version")}</dt><dd>${escapeHtml(item.version || tr("未標示", "Not specified"))}</dd></div>
            <div><dt>${tr("更新日期", "Updated")}</dt><dd>${escapeHtml(formatDate(item.updated))}</dd></div>
            <div><dt>${tr("檔案大小", "File size")}</dt><dd>${escapeHtml(item.size || tr("未標示", "Not specified"))}</dd></div>
            <div><dt>${tr("檔案類型", "File type")}</dt><dd>${escapeHtml(getFileType(item))}</dd></div>
            <div><dt>${tr("內容來源", "Source")}</dt><dd>${escapeHtml(item.source || tr("未標示", "Not specified"))}</dd></div>
            <div><dt>${tr("檔案路徑", "File path")}</dt><dd><code>${escapeHtml(item.file)}</code></dd></div>
          </dl>
          ${countMarkup}
          ${item.sourceUrl ? `<p class="source-link"><a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${tr("查看來源或授權說明", "View source or license information")}</a></p>` : ""}
          <div class="preview-actions">
            <button class="button button-secondary inline-open-button" type="button" data-url="${escapeHtml(item.file)}" data-viewer-url="${isPdf(item) ? escapeHtml(getPdfViewerUrl(item)) : ""}" data-pdf="${isPdf(item) ? "true" : "false"}">${isPdf(item) ? tr("PDF 預覽頁", "PDF Preview Page") : tr("新分頁開啟", "Open in New Tab")}</button>
            <a class="button button-primary download-button" href="${escapeHtml(item.file)}" data-id="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}">${tr("免費下載", "Free Download")}</a>
          </div>
        </aside>
      </div>`;
    elements.detailDialog.showModal();
    triggerPreviewDreamOpening();
    void loadDownloadCount(item);
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

  const startDownload = async (url, title = "", manualId = "") => {
    if (!url) return;
    if (manualId) void incrementDownloadCounter(manualId);
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

  const requestDownload = (url, title = "", manualId = "") => {
    pendingDownload = { url, title, manualId };
    if (hasAcceptedLegalNotice() || !elements.downloadDialog) {
      startDownload(url, title, manualId);
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
    state.manualPageIndex = 0;
    renderManuals();
  });

  elements.sortSelect?.addEventListener("change", (event) => {
    state.sort = event.target.value;
    state.manualPageIndex = 0;
    renderManuals();
  });

  elements.categoryFilters?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    state.manualPageIndex = 0;
    renderCategoryFilters();
    renderManuals();
  });

  elements.manualGrid?.addEventListener("click", (event) => {
    const navButton = event.target.closest("[data-manual-nav]");
    if (navButton) {
      const visible = getFilteredManuals();
      if (!visible.length) return;
      state.manualPageIndex = navButton.dataset.manualNav === "prev"
        ? (state.manualPageIndex - 1 + visible.length) % visible.length
        : (state.manualPageIndex + 1) % visible.length;
      renderManuals();
      return;
    }

    const pageButton = event.target.closest("[data-manual-page]");
    if (pageButton) {
      state.manualPageIndex = Number(pageButton.dataset.manualPage || 0) || 0;
      renderManuals();
      return;
    }

    const detailButton = event.target.closest(".detail-button");
    if (detailButton) showDetail(detailButton.dataset.id);
  });

  elements.starBillboardPrev?.addEventListener("click", () => updateStarBillboard(state.starBillboardIndex - 1, { restart: true }));
  elements.starBillboardNext?.addEventListener("click", () => updateStarBillboard(state.starBillboardIndex + 1, { restart: true }));
  elements.starBillboardDots?.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-star-billboard-dot]");
    if (!dot) return;
    updateStarBillboard(Number(dot.dataset.starBillboardDot || 0), { restart: true });
  });

  document.addEventListener("click", (event) => {
    const videoButton = event.target.closest(".video-launch-button");
    if (videoButton) {
      event.preventDefault();
      openHomepageVideo(videoButton.dataset.videoId || "");
      return;
    }

    const downloadButton = event.target.closest(".download-button");
    if (downloadButton) {
      event.preventDefault();
      requestDownload(downloadButton.getAttribute("href"), downloadButton.dataset.title || "", downloadButton.dataset.id || "");
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
    const { url, title, manualId } = pendingDownload;
    pendingDownload = null;
    elements.downloadDialog?.close();
    startDownload(url, title, manualId);
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
    state.manualPageIndex = 0;
    if (elements.searchInput) elements.searchInput.value = "";
    if (elements.sortSelect) elements.sortSelect.value = "updated-desc";
    renderCategoryFilters();
    renderManuals();
  });

  elements.themeToggle?.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });

  elements.dialogClose?.addEventListener("click", () => { clearActivePreviewObjectUrl(); elements.detailDialog.close(); });
  elements.detailDialog?.addEventListener("close", () => {
    elements.detailDialog?.classList.remove("is-opening");
  });
  elements.detailDialog?.addEventListener("click", (event) => {
    if (event.target === elements.detailDialog) { clearActivePreviewObjectUrl(); elements.detailDialog.close(); }
  });

  elements.videoDialogClose?.addEventListener("click", closeHomepageVideo);
  elements.videoDialog?.addEventListener("click", (event) => {
    if (event.target === elements.videoDialog) closeHomepageVideo();
  });
  elements.videoDialog?.addEventListener("close", () => {
    const player = elements.homepageVideoPlayer;
    if (player?.getAttribute("src")) {
      player.pause();
      player.removeAttribute("src");
      player.load();
    }
  });

  setSiteConfig();
  initStarBillboards();
  renderDonationButtons();
  initTheme();
  refreshAll();
  initHeroCarousel();
})();
