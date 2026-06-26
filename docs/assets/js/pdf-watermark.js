(() => {
  "use strict";

  const DEFAULTS = Object.freeze({
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
    angle: 135,
  });

  const normalize = (settings = {}) => ({
    mainScale: Math.min(1.60, Math.max(0.70, Number(settings.mainScale) || DEFAULTS.mainScale)),
    cornerScale: Math.min(1.25, Math.max(0.45, Number(settings.cornerScale) || DEFAULTS.cornerScale)),
    opacity: Math.min(0.45, Math.max(0.08, Number(settings.opacity) || DEFAULTS.opacity)),
    inset: Math.min(0.32, Math.max(0.08, Number(settings.inset) || DEFAULTS.inset)),
    topLeftXInset: Math.min(0.20, Math.max(0.00, Number.isFinite(Number(settings.topLeftXInset)) ? Number(settings.topLeftXInset) : DEFAULTS.topLeftXInset)),
    bottomRightXInset: Math.min(0.20, Math.max(0.00, Number.isFinite(Number(settings.bottomRightXInset)) ? Number(settings.bottomRightXInset) : DEFAULTS.bottomRightXInset)),
    copyrightText: String(settings.copyrightText || DEFAULTS.copyrightText).trim().slice(0, 80) || DEFAULTS.copyrightText,
    backgroundMode: ["none", "noise", "fibers", "image"].includes(String(settings.backgroundMode || "").toLowerCase()) ? String(settings.backgroundMode).toLowerCase() : DEFAULTS.backgroundMode,
    backgroundOpacity: Math.min(0.35, Math.max(0.00, Number.isFinite(Number(settings.backgroundOpacity)) ? Number(settings.backgroundOpacity) : DEFAULTS.backgroundOpacity)),
    backgroundImageDataUrl: String(settings.backgroundImageDataUrl || "").trim(),
    angle: Number.isFinite(Number(settings.angle)) ? Number(settings.angle) : DEFAULTS.angle,
  });

  const dataUrlToBytes = (dataUrl) => {
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
      return { bytes: dataUrlToBytes(dataUrl), dataUrl };
    }
    const dataUrl = createWatermarkBackgroundDataUrl(normalized, seedText);
    if (!dataUrl) return null;
    return { bytes: dataUrlToBytes(dataUrl), dataUrl };
  };

  const applyPreviewBackgroundTexture = (settings, seedText = "") => {
    if (!elements.watermarkPreviewTexture) return;
    const dataUrl = createWatermarkBackgroundDataUrl(settings, seedText);
    elements.watermarkPreviewTexture.style.backgroundImage = dataUrl ? `url(${JSON.stringify('')})` : "none";
  };


  const splitLines = (textValue) => {
    const [rawTitle, rawCopyright = "內容版權所有"] = String(textValue || "").split("｜");
    return [rawTitle || "教練手冊", rawCopyright || "內容版權所有"];
  };

  const createPng = (textValue) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("瀏覽器無法建立浮水印畫布");
    const lines = splitLines(textValue);
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
    return { bytes: dataUrlToBytes(canvas.toDataURL("image/png")), aspectRatio: canvas.height / canvas.width };
  };

  const drawAt = ({ page, image, data, scale, opacity, inset, topLeftXInset, bottomRightXInset, position, degrees, angleDegrees }) => {
    const { width, height } = page.getSize();
    const rotation = Number.isFinite(Number(angleDegrees)) ? Number(angleDegrees) : 45;
    const angle = (rotation * Math.PI) / 180;
    let imageWidth = width * scale;
    let imageHeight = imageWidth * data.aspectRatio;

    const calcBounds = () => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const corners = [
        [0, 0],
        [imageWidth * cos, imageWidth * sin],
        [-imageHeight * sin, imageHeight * cos],
        [imageWidth * cos - imageHeight * sin, imageWidth * sin + imageHeight * cos],
      ];
      const xs = corners.map(([x]) => x);
      const ys = corners.map(([, y]) => y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { minX, maxX, minY, maxY, bboxWidth: maxX - minX, bboxHeight: maxY - minY };
    };

    let bounds = calcBounds();
    const horizontalInset = position === "top-left"
      ? (Number.isFinite(Number(topLeftXInset)) ? Number(topLeftXInset) : inset)
      : (position === "bottom-right"
        ? (Number.isFinite(Number(bottomRightXInset)) ? Number(bottomRightXInset) : inset)
        : inset);
    const maxWidth = width * (position === "center" ? 0.98 : (1 - Math.max(inset, horizontalInset) * 1.20));
    const maxHeight = height * (position === "center" ? 0.74 : 0.48);
    const fit = Math.min(1, maxWidth / bounds.bboxWidth, maxHeight / bounds.bboxHeight);
    imageWidth *= fit;
    imageHeight *= fit;
    bounds = calcBounds();

    let targetLeft;
    let targetBottom;
    if (position === "top-left") {
      targetLeft = width * (Number.isFinite(Number(topLeftXInset)) ? Number(topLeftXInset) : inset);
      targetBottom = height * (1 - inset) - bounds.bboxHeight;
    } else if (position === "bottom-right") {
      targetLeft = width * (1 - (Number.isFinite(Number(bottomRightXInset)) ? Number(bottomRightXInset) : inset)) - bounds.bboxWidth;
      targetBottom = height * inset;
    } else {
      targetLeft = (width - bounds.bboxWidth) / 2;
      targetBottom = (height - bounds.bboxHeight) / 2;
    }

    const x = targetLeft - bounds.minX;
    const y = targetBottom - bounds.minY;
    page.drawImage(image, { x, y, width: imageWidth, height: imageHeight, rotate: degrees(rotation), opacity });
  };

  const drawBackgroundTextureAt = ({ page, backgroundImage, opacity }) => {
    const { width, height } = page.getSize();
    page.drawImage(backgroundImage, { x: 0, y: 0, width, height, opacity });
  };

  const apply = async (pdfBytes, title, settings = {}) => {
    if (!window.PDFLib) throw new Error("PDF 處理元件尚未載入");
    const { PDFDocument, degrees } = window.PDFLib;
    const normalized = normalize(settings);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
    const data = createPng(`${title}｜${normalized.copyrightText}`);
    const image = await pdfDoc.embedPng(data.bytes);
    const backgroundData = await createWatermarkBackgroundPng(normalized, title);
    const backgroundImage = backgroundData ? await pdfDoc.embedPng(backgroundData.bytes) : null;
    for (const page of pdfDoc.getPages()) {
      if (backgroundImage && normalized.backgroundMode !== "none") {
        drawBackgroundTextureAt({ page, backgroundImage, opacity: normalized.backgroundOpacity });
      }
      drawAt({ page, image, data, scale: normalized.mainScale, opacity: normalized.opacity, inset: normalized.inset, position: "center", topLeftXInset: normalized.topLeftXInset, bottomRightXInset: normalized.bottomRightXInset, degrees, angleDegrees: normalized.angle });
      drawAt({ page, image, data, scale: normalized.cornerScale, opacity: normalized.opacity * 0.82, inset: normalized.inset, topLeftXInset: normalized.topLeftXInset, bottomRightXInset: normalized.bottomRightXInset, position: "top-left", degrees, angleDegrees: normalized.angle });
      drawAt({ page, image, data, scale: normalized.cornerScale, opacity: normalized.opacity * 0.82, inset: normalized.inset, topLeftXInset: normalized.topLeftXInset, bottomRightXInset: normalized.bottomRightXInset, position: "bottom-right", degrees, angleDegrees: normalized.angle });
    }
    return pdfDoc.save({ useObjectStreams: true });
  };

  window.PDFWatermark = { DEFAULTS, normalize, apply };
})();
