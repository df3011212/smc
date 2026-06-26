(() => {
  "use strict";

  const config = Object.freeze({
    user: "hongshihong19",
    repo: "sr-smc-vwap-coach-v6-6-9-public-site",
    label: "累積瀏覽人次",
    labelColor: "#14213D",
    countColor: "#C99A43",
  });

  const localHosts = new Set(["", "localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  const isLocalPreview = window.location.protocol === "file:" || localHosts.has(window.location.hostname);

  const counter = document.createElement("aside");
  counter.className = "global-visitor-counter";
  counter.setAttribute("aria-label", "網站累積瀏覽人次");
  counter.setAttribute("role", "status");

  const dot = document.createElement("span");
  dot.className = "global-visitor-counter__dot";
  dot.setAttribute("aria-hidden", "true");

  const content = document.createElement("span");
  content.className = "global-visitor-counter__content";

  counter.append(dot, content);
  document.body.append(counter);
  document.documentElement.classList.add("has-global-visitor-counter");

  if (isLocalPreview) {
    counter.classList.add("is-local-preview");
    content.textContent = "本機預覽｜正式網站才會累計瀏覽人次";
    counter.title = "本機 localhost 預覽不會計入公開網站瀏覽人次";
    return;
  }

  const url = new URL("https://api.visitorbadge.io/api/VisitorHit");
  url.searchParams.set("user", config.user);
  url.searchParams.set("repo", config.repo);
  url.searchParams.set("label", config.label);
  url.searchParams.set("labelColor", config.labelColor);
  url.searchParams.set("countColor", config.countColor);

  const image = document.createElement("img");
  image.className = "global-visitor-counter__badge";
  image.src = url.href;
  image.alt = "網站累積瀏覽人次";
  image.decoding = "async";
  image.referrerPolicy = "no-referrer";

  image.addEventListener("load", () => {
    counter.classList.add("is-loaded");
  }, { once: true });

  image.addEventListener("error", () => {
    counter.classList.add("is-unavailable");
    content.textContent = "瀏覽人次暫時無法顯示";
    counter.title = "第三方瀏覽人次服務目前無法連線";
  }, { once: true });

  content.append(image);
  counter.title = "累積頁面瀏覽人次；不是不重複訪客人數";
})();
