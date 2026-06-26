(() => {
  "use strict";
  const STORAGE_KEY = "srSiteLanguage_v1";
  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  const storedLanguage = localStorage.getItem(STORAGE_KEY);
  const language = requestedLanguage === "en" || requestedLanguage === "zh-Hant" ? requestedLanguage : (storedLanguage === "en" ? "en" : "zh-Hant");
  const isEnglish = language === "en";
  document.documentElement.lang = language;
  window.SR_SITE_LANGUAGE = language;
  const textMap = {
  "SR+SMC+VWAP 多空雙向教練 v6.6.9": "SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "手冊下載": "Manuals",
  "SMC 組合02｜RVOL + Open Interest 副圖教練 v2 腳本安裝": "Install SMC Combination 02 | RVOL + Open Interest Subpanel Coach v2",
  "文章公告": "Articles",
  "手冊首頁": "Manual Home",
  "瀏覽文章與公告": "Browse Articles & Announcements",
  "文章與公告": "Articles & Announcements",
  "文章、最新消息與網站公告": "Articles, Updates & Announcements",
  "查看教練版本更新、使用說明、交易觀念文章，以及由 Threads 等平台嵌入的公開內容。": "Read coach-version updates, usage notes, trading-concept articles, and public posts embedded from Threads and other platforms.",
  "篇公開文章": "published articles",
  "最新發布": "Newest",
  "最早發布": "Oldest",
  "精選優先": "Featured First",
  "目前沒有符合條件的文章": "No matching articles",
  "請改用其他關鍵字或切換分類。": "Try another keyword or category.",
  "返回文章列表": "Back to Articles",
  "法律與風險聲明": "Legal & Risk Notice",
  "官方安裝與作者社群": "Official Installation & Author Community",
  "TradingView 腳本": "TradingView Script",
  "SR＋SMC＋VWAP 多空雙向教練 TradingView 腳本 安裝": "Install the SR + SMC + VWAP Long/Short Trading Coach on TradingView",
  "作者 Threads": "Author on Threads",
  "Support Resistance + SMC Coach + VWAP｜集中放置 PDF、Pine Script、ZIP 與教學教材，讓版本更新、下載與查找更清楚。": "Support Resistance + SMC Coach + VWAP | A centralized library for PDFs, Pine Script, ZIP packages, and training materials, with clearer versioning, downloads, and search.",
  "最新版本 v6.6.9": "Latest Version v6.6.9",
  "企業培訓手冊風": "Corporate Training Manual Style",
  "支援 PDF 線上預覽": "Online PDF Preview",
  "GitHub Pages 靜態部署": "Static Deployment on GitHub Pages",
  "目前首頁顯示的是本機草稿資料。若要同步到 GitHub 公開網站，仍需從管理頁匯出新的": "The homepage is currently showing a local draft. To publish it to GitHub, export a new",
  "並重新上傳。": "and upload it again.",
  "立即瀏覽手冊": "Browse Manuals",
  "使用與風險聲明": "Terms & Risk Notice",
  "份手冊與檔案": "manuals and files",
  "個內容分類": "content categories",
  "最近更新日期": "latest update",
  "精選手冊投影輪播": "Featured Manual Slideshow",
  "完整使用教學手冊｜主教練手冊": "Complete User Guide | Main Coach Manual",
  "實戰 K 棒情境教學手冊": "Practical Candlestick Scenario Manual",
  "多單／空單核心流程與情境解析": "Core long/short workflows and scenario analysis",
  "支撐阻力 + SMC 多空雙向教練版": "Support/Resistance + SMC Long/Short Coach",
  "15M 進場｜1H 主要離場｜人工停損與報酬比": "15m entries | 1h primary exits | Manual stops and risk/reward",
  "SMC 組合 02｜RVOL + Open Interest": "SMC Combination 02 | RVOL + Open Interest",
  "副圖教練 v2｜新手從零到實戰完整使用說明書": "Subpanel Coach v2 | Complete beginner-to-practice guide",
  "訓練內容重點": "Training Highlights",
  "以現代企業培訓手冊的資訊層級，快速看懂這份教練系統的核心內容。": "A modern corporate-training layout that helps you understand the core system quickly.",
  "快速上手": "Quick Start",
  "從基礎觀念到實戰應用，建立多空雙向教練的使用流程與節奏。": "Build a consistent long/short coaching workflow from fundamentals to practical use.",
  "指標架構": "Indicator Architecture",
  "整理 S/R、SMC、OB、FVG、VWAP 與平行通道的模組化結構。": "A modular structure covering S/R, SMC, OB, FVG, VWAP, and parallel channels.",
  "K 棒情境講解": "Candlestick Scenarios",
  "透過路徑、節點與情境示意，提升判讀與決策的一致性。": "Improve interpretation and decision consistency with paths, nodes, and scenarios.",
  "核心程式碼說明": "Core Code Guide",
  "理解程式運作邏輯、設定項目與後續維護方式，便於持續迭代。": "Understand program logic, settings, and maintenance for continued iteration.",
  "全部內容免費提供，不收取課程費、會員費或下載費。": "All content is free. No course, membership, or download fees are charged.",
  "本網站供教學與個人研究使用；下載前請確認版本、更新日期與適用內容。": "For education and personal research only. Check the version, update date, and applicability before downloading.",
  "下載與使用前請先了解": "Read Before Downloading or Using",
  "查看完整聲明": "View Full Notice",
  "免費不等於放棄著作權": "Free Does Not Mean Copyright Is Waived",
  "教材可免費下載與個人學習；除另有授權，不得冒名、移除署名、轉售或付費再包裝。": "Materials may be downloaded for personal learning, but may not be impersonated, stripped of attribution, resold, or repackaged for a fee unless separately licensed.",
  "不構成投資建議": "Not Investment Advice",
  "內容僅為技術教學與研究，不提供代操、個別化買賣建議或獲利保證。": "Content is for technical education and research only; it does not provide managed trading, personalized recommendations, or profit guarantees.",
  "程式與資料可能有誤": "Code and Data May Contain Errors",
  "指標、腳本與範例應先回測及模擬驗證，使用者須自行承擔交易與系統風險。": "Indicators, scripts, and examples should be backtested and simulated first. Users assume all trading and system risks.",
  "尊重第三方權利": "Respect Third-Party Rights",
  "如認為內容涉及著作權、商標或個資，請依權利通知頁提供具體資料申請處理。": "For copyright, trademark, or personal-data concerns, submit specific information through the rights-notice page.",
  "教練手冊下載中心": "Coach Manual Download Center",
  "正在載入資料...": "Loading data...",
  "排序": "Sort",
  "最近更新": "Newest",
  "最早更新": "Oldest",
  "名稱 A–Z": "Title A–Z",
  "精選優先": "Featured First",
  "找不到符合條件的手冊": "No Matching Manuals Found",
  "請改用其他關鍵字，或切換到「全部」分類。": "Try another keyword or switch to the All category.",
  "清除篩選": "Clear Filters",
  "免費教學資源網站；不收費、不代操、不保證收益，亦非 TradingView、GitHub 或任何金融機構的官方網站。": "A free educational-resource website. No fees, managed trading, or profit guarantees. Not an official site of TradingView, GitHub, or any financial institution.",
  "使用條款與免責聲明": "Terms of Use & Disclaimer",
  "隱私政策": "Privacy Policy",
  "著作權與下架通知": "Copyright & Takedown Notice",
  "作者／著作權人：": "Author / Copyright Owner:",
  "版本：": "Version:",
  "© 2026 Threads（@hongshihong19）著作權所有。": "© 2026 Threads (@hongshihong19). All rights reserved.",
  "下載前確認": "Download Confirmation",
  "本網站內容全部免費，不收取任何費用。教材僅供教學、研究與個人學習，不構成投資建議、代操服務或獲利保證。": "All website content is free. Materials are for education, research, and personal learning only and do not constitute investment advice, managed trading, or a profit guarantee.",
  "免費下載不代表放棄著作權或允許轉售。": "Free download does not waive copyright or permit resale.",
  "請先回測、模擬並確認程式碼與參數後再使用。": "Backtest, simulate, and verify the code and parameters before use.",
  "投資與交易可能造成部分或全部本金損失，結果由使用者自行承擔。": "Investing and trading may cause partial or total loss of principal. Users assume the outcome.",
  "我已閱讀並同意": "I have read and agree to the",
  "使用條款與風險聲明": "Terms of Use and Risk Notice",
  "取消": "Cancel",
  "同意並免費下載": "Agree & Download Free",
  "返回首頁": "Back to Home",
  "權利通知": "Rights Notice",
  "使用條款、免費聲明與風險免責": "Terms, Free-Access Statement & Risk Disclaimer",
  "本頁說明本網站及其下載內容的使用界線。網站為免費的教學與研究資源，不收費、不代操、不接受交易委託，亦不保證任何收益。": "This page defines the permitted use of the website and its downloads. The site is a free educational and research resource. It charges no fees, provides no managed trading, accepts no trading mandates, and guarantees no returns.",
  "最重要的三件事": "Three Key Points",
  "所有內容均免費；任何內容都不是個別化投資建議；免費下載不代表著作權已放棄或可以拿去轉售。": "All content is free; nothing is personalized investment advice; and free download does not mean copyright is waived or resale is allowed.",
  "1. 免費提供聲明": "1. Free-Access Statement",
  "2. 教學用途與非投資建議": "2. Educational Use and No Investment Advice",
  "3. 投資與交易風險": "3. Investment and Trading Risk",
  "4. 軟體與程式碼風險": "4. Software and Code Risk",
  "5. 資訊正確性與更新": "5. Accuracy and Updates",
  "6. 第三方平台與商標": "6. Third-Party Platforms and Trademarks",
  "7. 禁止使用方式": "7. Prohibited Uses",
  "8. 網站可用性": "8. Website Availability",
  "9. 條款變更": "9. Changes to These Terms",
  "10. 準據法": "10. Governing Law",
  "11. 官方參考資料": "11. Official References",
  "本網站目前提供的網頁、教練手冊、範例程式、Pine Script、壓縮檔、圖片及其他教材，原則上均可免費瀏覽或下載。本網站不收取課程費、會員費、訂閱費、軟體授權費、下載費、保證金或任何形式的交易款項。": "Web pages, coach manuals, sample programs, Pine Script files, archives, images, and other materials are generally available to view or download free of charge. The site charges no course, membership, subscription, software-license, download, deposit, or transaction fees.",
  "若有人冒用本網站、作者名稱或教材內容向你收費、要求匯款、索取密碼、助記詞、API 金鑰、信用卡資料或保證金，請勿提供資料或付款，並立即停止聯絡。": "If anyone impersonates this site or its author to request payment, transfers, passwords, seed phrases, API keys, card data, or deposits, do not provide information or pay and stop contact immediately.",
  "網站內容僅供技術教學、程式研究、交易觀念整理與一般資訊參考，不針對任何人的財務狀況、投資目標、風險承受能力或特定標的提供個別化建議。": "Content is for technical education, code research, trading-concept organization, and general information only. It is not tailored to any person's finances, objectives, risk tolerance, or specific instrument.",
  "本網站不提供證券投資顧問、期貨顧問、虛擬資產投資顧問、代客操作、跟單、資金保管、下單執行、保證獲利或損失補償服務。任何圖表、路徑、訊號、回測、勝率或績效範例，都不應被解讀為買進、賣出或持有任何金融商品的指示。": "The site does not provide securities, futures, or virtual-asset advisory services, managed accounts, copy trading, custody, order execution, profit guarantees, or loss compensation. Charts, paths, signals, backtests, win rates, and performance examples are not instructions to buy, sell, or hold any financial product.",
  "股票、期貨、選擇權、外匯、槓桿商品及虛擬資產等交易均可能發生重大波動，並可能造成部分或全部本金損失。槓桿、保證金與衍生性商品的損失可能在短時間內迅速擴大。": "Stocks, futures, options, foreign exchange, leveraged products, and virtual assets can be highly volatile and may cause partial or total loss of principal. Losses from leverage, margin, and derivatives can grow rapidly.",
  "過去績效、歷史回測、模擬結果、機率模型或範例交易，不代表未來表現。使用者應自行查證資料、瞭解商品與交易規則、評估自身財務能力及風險承受度，並透過合法金融機構進行交易。": "Past performance, historical backtests, simulations, probability models, and sample trades do not predict future results. Users must verify information, understand products and rules, assess their finances and risk tolerance, and trade through lawful financial institutions.",
  "4. 軟體、指標與程式碼風險": "4. Software, Indicator, and Code Risk",
  "程式碼、指標、策略、警報、資料處理與圖表顯示可能含有錯誤、延遲、重繪、資料缺漏、版本不相容、平台限制、參數不適用或其他未預期問題。使用前應先閱讀原始碼、確認權限、進行回測、模擬交易與小額驗證。": "Code, indicators, strategies, alerts, data processing, and chart displays may contain errors, delays, repainting, missing data, incompatibilities, platform limits, unsuitable parameters, or other unexpected issues. Review source code, permissions, backtests, simulations, and small-scale tests before use.",
  "請勿把下載檔案直接用於實盤自動下單、資金控制或重要系統。使用者應自行備份資料、掃描檔案、妥善保管 API 金鑰，並禁止把私鑰、助記詞、密碼或其他敏感資訊寫入公開程式碼與 GitHub Repository。": "Do not use downloaded files directly for live automated orders, fund control, or critical systems. Back up and scan files, protect API keys, and never place private keys, seed phrases, passwords, or other sensitive data in public code or a GitHub repository.",
  "我們會盡力維護內容，但不保證所有資訊在任何時間都完整、正確、最新或適合特定用途。金融市場規則、TradingView 功能、Pine Script 語法、GitHub 服務與第三方資料可能隨時變更。": "We strive to maintain the content but do not guarantee that all information is always complete, accurate, current, or suitable for a particular purpose. Market rules, TradingView features, Pine Script syntax, GitHub services, and third-party data may change at any time.",
  "若手冊、程式碼與網站說明不一致，請以檔案版本、更新日期、原始碼及相關官方文件為準。": "If manuals, code, and website descriptions differ, refer to the file version, update date, source code, and relevant official documentation.",
  "TradingView、Pine Script、GitHub，以及網站中可能提及的交易所、券商、金融商品、公司名稱、標誌與商標，均屬各自權利人所有。除非明確書面說明，本網站與上述第三方不存在代理、授權、認證、贊助或官方合作關係。": "TradingView, Pine Script, GitHub, and any exchanges, brokers, products, companies, logos, or trademarks mentioned belong to their respective owners. Unless expressly stated in writing, this site has no agency, license, certification, sponsorship, or official partnership with them.",
  "外部連結僅為方便使用者查閱。第三方網站的內容、可用性、安全性、隱私政策與服務條款，應由該第三方負責。": "External links are provided for convenience. Third parties are responsible for their content, availability, security, privacy policies, and terms.",
  "除個別檔案另有明確授權外，使用者不得：": "Unless a specific file grants otherwise, users may not:",
  "將免費教材轉售、設為付費會員內容，或以課程費、授權費、訂閱費等形式重新收費。": "Resell free materials, place them behind paid membership, or re-charge them as course, license, or subscription content.",
  "移除作者、版本、來源、風險警語或著作權標示。": "Remove author, version, source, risk warnings, or copyright notices.",
  "冒充作者、官方網站、TradingView、GitHub、金融機構或任何第三方。": "Impersonate the author, official website, TradingView, GitHub, a financial institution, or any third party.",
  "宣稱使用本教材可保證獲利、穩賺不賠、固定月報酬或無風險套利。": "Claim that the materials guarantee profits, no-loss returns, fixed monthly returns, or risk-free arbitrage.",
  "散布惡意程式、後門、竊取憑證的程式碼，或將本網站用於詐騙、洗錢及其他違法行為。": "Distribute malware, backdoors, credential-stealing code, or use the site for fraud, money laundering, or other unlawful acts.",
  "上傳或散布未取得權利人許可的受保護內容、個人資料或機密資訊。": "Upload or distribute protected content, personal data, or confidential information without authorization.",
  "8. 網站可用性與責任限制": "8. Website Availability and Limitation of Liability",
  "本網站採 GitHub Pages 靜態託管，定位為本專案的教學、文件與版本展示網站，而不是通用的大量檔案儲存或商業下載服務。網站可能因平台政策、維護、流量限制、檔案大小、網路異常、Repository 設定或第三方服務變更而暫停、延遲或失效。我們不保證網站永久存在或所有下載連結持續可用。": "This site uses static hosting on GitHub Pages and is intended for project education, documentation, and version display—not general bulk file storage or a commercial download service. It may be interrupted, delayed, or unavailable due to platform policies, maintenance, traffic limits, file sizes, network issues, repository settings, or third-party changes. Permanent availability is not guaranteed.",
  "在適用法律允許的最大範圍內，因使用或無法使用網站、下載內容、程式碼、訊號或第三方連結所生的直接或間接損失，應由使用者依實際情況自行承擔。本條不排除法律不得預先免除或限制的責任。": "To the fullest extent allowed by applicable law, users bear direct or indirect losses arising from use or inability to use the site, downloads, code, signals, or third-party links. This does not exclude liabilities that law does not allow to be waived or limited in advance.",
  "本網站可因服務內容、法律、平台規則或風險狀況變更而更新本聲明。新版自公布於網站時生效，頁面上會標示最後更新日期。重大變更時，網站首頁可另行顯示提醒。": "This notice may be updated as services, law, platform rules, or risks change. A new version takes effect when published and will show its update date. Major changes may also be announced on the homepage.",
  "10. 準據法與其他": "10. Governing Law and Other Terms",
  "本聲明原則上依中華民國（臺灣）法律解釋與適用；但使用者所在地的強制規定或其他不得排除的法律另有規定者，從其規定。任何條款如被認定無效，不影響其他條款的效力。": "This notice is generally interpreted under the laws of the Republic of China (Taiwan), subject to mandatory laws applicable in a user's location. If any provision is invalid, the remaining provisions remain effective.",
  "本頁為一般性網站風險管理文字，不是針對特定案件提供的法律意見。若網站規模、功能、內容來源或營運方式改變，應再請專業人士依實際情況檢視。": "This page is general website risk-management language, not legal advice for a specific matter. Professional review should be obtained if the site's scale, features, sources, or operations change.",
  "全國法規資料庫：著作權法": "Laws & Regulations Database of Taiwan: Copyright Act",
  "全國法規資料庫：個人資料保護法": "Laws & Regulations Database of Taiwan: Personal Data Protection Act",
  "金融監督管理委員會：金融知識與投資風險宣導": "Financial Supervisory Commission: Financial Education and Investment Risk",
  "免費教學資源；不收費、不代操、不保證收益。": "Free educational resources; no fees, managed trading, or profit guarantees.",
  "使用條款": "Terms of Use",
  "本網站是部署於 GitHub Pages 的純靜態網站，不設會員、付款、留言、雲端後台或站方資料庫。": "This is a static website deployed on GitHub Pages. It has no membership, payment, comments, cloud admin panel, or site-owned database.",
  "1. 本網站不主動蒐集的資料": "1. Data the Site Does Not Actively Collect",
  "本網站目前不提供帳號註冊、登入、電子報、付款、線上客服表單或檔案上傳功能，因此站方不會透過網站主動要求姓名、電話、地址、身分證字號、信用卡、銀行帳戶、密碼、API 金鑰、私鑰或助記詞。": "The site currently provides no account registration, login, newsletter, payment, support form, or file upload, and therefore does not actively request names, phone numbers, addresses, identification numbers, card or bank data, passwords, API keys, private keys, or seed phrases.",
  "2. 瀏覽器本機儲存": "2. Browser Local Storage",
  "網站可能使用瀏覽器的": "The website may use browser",
  "保存下列資料：": "to store the following:",
  "深色或淺色模式偏好。": "Dark or light theme preference.",
  "本地管理頁建立的手冊草稿。": "Manual drafts created in the local admin tool.",
  "使用者是否已確認下載前風險提醒。": "Whether the user confirmed the pre-download risk notice.",
  "這些資料原則上儲存在使用者自己的瀏覽器中，不會由本網站程式自動傳送給站長。使用者可透過瀏覽器網站資料設定自行清除。": "This data is generally stored in the user's browser and is not automatically sent to the site owner. Users can clear it through browser site-data settings.",
  "3. GitHub 與基礎網路紀錄": "3. GitHub and Basic Network Logs",
  "本網站由 GitHub Pages 託管。使用者瀏覽網站時，GitHub、網路服務供應商、DNS、CDN 或瀏覽器可能依其服務運作及隱私政策處理 IP 位址、請求時間、裝置或瀏覽器資訊等技術紀錄。此類資料不由本網站自行控制。": "The site is hosted by GitHub Pages. GitHub, internet providers, DNS, CDNs, or browsers may process IP addresses, request times, device, or browser information according to their operations and privacy policies. The site does not control those records.",
  "4. 瀏覽人次計數與分析工具": "4. Visitor and Download Counters",
  "本網站頁面頂端使用第三方 Visitor Badge 計數服務顯示累積頁面瀏覽人次。載入計數圖示時，使用者的瀏覽器會直接向該第三方服務提出請求，因此該服務可能依其系統運作處理 IP 位址、請求時間、瀏覽器或裝置等基本技術資訊。": "The site uses a third-party Visitor Badge service to display cumulative page views and CounterAPI to record clicks on free-download buttons. A user's browser sends requests directly to those services, which may process basic technical information such as IP address, request time, browser, or device data.",
  "此計數僅用於顯示累積頁面瀏覽次數，不代表不重複訪客人數。本網站仍未內建 Google Analytics、Meta Pixel、廣告追蹤或第三方行銷 Cookie；若日後加入其他分析、廣告或識別技術，應再更新本政策。": "These counters show cumulative requests or download-button clicks and do not represent unique visitors or guaranteed completed downloads. The site does not currently embed Google Analytics, Meta Pixel, ad tracking, or third-party marketing cookies. This policy should be updated before adding such technologies.",
  "5. 外部連結與下載": "5. External Links and Downloads",
  "網站可能連結到 GitHub、TradingView、金融機構或其他第三方網站。第三方服務如何蒐集、處理與利用資料，應以其隱私政策為準。下載檔案後的保存、執行與分享行為，也由使用者自行管理。": "The site may link to GitHub, TradingView, financial institutions, or other third parties. Their privacy policies govern their data practices. Users are responsible for storing, running, and sharing downloaded files.",
  "6. 請勿提交敏感資訊": "6. Do Not Submit Sensitive Information",
  "請勿透過 GitHub Issues、公開 Repository、公開留言或任何公開管道提交密碼、私鑰、助記詞、API 金鑰、完整身分證件、銀行資料、醫療資料或其他不必要的敏感資訊。權利通知僅需提供足以辨識權利、內容位置及聯絡方式的必要資料。": "Do not submit passwords, private keys, seed phrases, API keys, full identification documents, banking data, medical data, or unnecessary sensitive information through GitHub Issues, public repositories, comments, or other public channels. Rights notices should include only information needed to identify the right, content location, and contact method.",
  "7. 個人資料權利與聯絡": "7. Personal-Data Rights and Contact",
  "若你認為本網站公開內容包含你的個人資料，請依": "If you believe public content includes your personal data, use the",
  "頁提供具體網址、檔名、資料位置與必要聯絡資訊。我們會依實際情況檢視並處理。": "page to provide the exact URL, filename, data location, and necessary contact information. We will review and handle it based on the circumstances.",
  "8. 政策更新": "8. Policy Updates",
  "若網站新增帳號、留言、分析、廣告、付款、雲端資料庫或其他會處理個人資料的功能，應在功能上線前重新檢視並更新本政策。": "This policy should be reviewed and updated before adding accounts, comments, analytics, advertising, payments, cloud databases, or other personal-data processing features.",
  "著作權、免費使用界線與權利通知": "Copyright, Free-Use Boundaries & Rights Notice",
  "本網站尊重著作權、商標、個人資料與其他合法權利。如內容確有疑義，請提供具體資訊，以便快速定位與處理。": "The site respects copyright, trademarks, personal data, and other lawful rights. Provide specific information so concerns can be located and handled quickly.",
  "免費下載不等於公有領域": "Free Download Does Not Mean Public Domain",
  "除個別檔案另有明確授權外，網站內容可免費供個人學習與非商業研究使用，但著作權與署名權仍受保留。": "Unless a file states otherwise, content may be used free for personal learning and non-commercial research, but copyright and attribution rights remain reserved.",
  "提交權利通知或下架申請": "Submit a Rights Notice or Takedown Request",
  "網站上線至 GitHub Pages 後，系統會自動建立本 Repository 的 Issues 聯絡連結。": "After deployment to GitHub Pages, the site automatically creates an Issues contact link for this repository.",
  "開啟 GitHub Issues": "Open GitHub Issues",
  "1. 內容來源原則": "1. Content-Source Principles",
  "網站管理者應僅上傳自行創作、已取得合法授權、屬於公有領域，或依法得合理使用的內容。不得因為網路上可以找到、可以下載，或標示免費，就推定可以任意重製、散布或重新上架。": "Administrators should upload only original, lawfully licensed, public-domain, or legally fair-use content. Availability online, downloadability, or a free label does not automatically permit copying, distribution, or republication.",
  "2. 免費使用範圍": "2. Scope of Free Use",
  "除檔案內另有授權條款外，使用者可免費：": "Unless a file states otherwise, users may free of charge:",
  "下載並保存一份或合理數量的副本供個人學習。": "Download and retain one or a reasonable number of copies for personal learning.",
  "在非商業、非冒名且保留來源的情況下引用少量內容。": "Quote limited portions non-commercially, without impersonation, and with attribution.",
  "依教材進行回測、模擬、研究與個人程式修改。": "Use the material for backtesting, simulation, research, and personal code modifications.",
  "未經另外同意，不得轉售、收費再包裝、建立付費會員庫、冒名發布、移除作者與版本資訊，或宣稱為官方授權課程。": "Without separate permission, users may not resell, repackage for a fee, create a paid library, impersonate the author, remove author/version information, or claim official course authorization.",
  "3. 程式碼與個別檔案授權": "3. Code and File-Specific Licenses",
  "若某一份程式碼、手冊或壓縮檔內附有獨立授權條款、開源授權或第三方授權，應優先依該檔案的條款使用。不同檔案可能有不同的修改、散布、署名或商業使用條件。": "If code, a manual, or an archive contains its own license, open-source license, or third-party terms, those file-specific terms take priority. Different files may have different modification, distribution, attribution, or commercial-use conditions.",
  "4. 商標與平台名稱": "4. Trademarks and Platform Names",
  "TradingView、Pine Script、GitHub，以及其他公司、產品、交易所與服務名稱均可能是其權利人的商標。本網站僅在描述相容性、教學對象或技術環境時使用相關名稱，不表示取得官方認證或合作。": "TradingView, Pine Script, GitHub, and other company, product, exchange, and service names may be trademarks of their owners. They are used only to describe compatibility, learning targets, or technical environments and do not imply certification or partnership.",
  "5. 權利通知應提供的資料": "5. Information Required in a Rights Notice",
  "若你是權利人或獲合法授權的代理人，認為網站內容侵害著作權、商標、個人資料或其他權利，請透過本網站所屬 GitHub Repository 的": "If you are a rights holder or authorized agent and believe content infringes copyright, trademark, personal data, or other rights, submit a notice through this site's GitHub repository",
  "或站長另行提供的聯絡方式提交通知，並包含：": "or another contact method provided by the administrator, including:",
  "通知人姓名或單位名稱，以及可回覆的聯絡方式。": "Name or organization and a reply contact method.",
  "所主張權利的作品、商標、資料或其他權利之具體說明。": "A specific description of the work, trademark, data, or other right claimed.",
  "涉嫌侵權內容的完整網址、檔名、頁面區塊或可定位資訊。": "The full URL, filename, page section, or other locating details for the disputed content.",
  "足以說明權利歸屬或代理權限的資料。": "Information sufficient to show ownership or authority to act.",
  "你希望採取的處理方式，例如更正署名、移除特定檔案或暫時下架。": "The requested action, such as correcting attribution, removing a file, or temporary takedown.",
  "聲明所提供資料真實，且通知係基於善意提出。": "A statement that the information is truthful and the notice is submitted in good faith.",
  "請勿在公開 Issue 中張貼身分證、銀行帳戶、私鑰、密碼或其他不必要的敏感資料。": "Do not post identification numbers, bank accounts, private keys, passwords, or unnecessary sensitive data in a public Issue.",
  "6. 處理流程": "6. Handling Process",
  "收到可辨識的通知後，網站管理者可先暫時停用爭議內容或下載連結，並檢視來源、授權與雙方說明。若通知資料不足，可能要求補充。若爭議無法單純確認，相關內容可維持暫時下架，直到權利狀況較為明確。": "After receiving an identifiable notice, the administrator may temporarily disable disputed content or download links and review sources, licenses, and both sides' explanations. Additional information may be requested. Content may remain temporarily unavailable until rights are clearer.",
  "7. 惡意或不實通知": "7. Malicious or False Notices",
  "請勿利用權利通知制度騷擾、冒名、打擊競爭者或要求移除不屬於你的內容。通知人應自行確認其權利基礎與陳述真實性。": "Do not use the notice process to harass, impersonate, target competitors, or remove content you do not own. Submitters must verify their legal basis and truthfulness.",
  "8. GitHub 平台程序": "8. GitHub Platform Procedures",
  "本網站部署於 GitHub Pages。權利人除可先聯絡網站管理者外，也可以依 GitHub 公布的內容移除、著作權或私人資訊申訴程序處理。GitHub 是否移除內容，仍由平台依其政策與收到的資料判斷。": "The site is deployed on GitHub Pages. Rights holders may contact the administrator first or use GitHub's content-removal, copyright, or private-information complaint procedures. GitHub decides removal under its policies and submitted information.",
  "PDF 預覽頁": "PDF Preview",
  "下載 PDF": "Download PDF",
  "PDF 預覽": "PDF Preview",
  "此頁直接顯示 docs/files 內的 PDF，不會再另外疊加或產生線上預覽浮水印。": "This page directly displays the PDF stored in docs/files without adding or generating another online-preview watermark.",
  "正在載入 PDF，請稍候…": "Loading PDF, please wait…",
  "永久浮水印會保留：": "Permanent watermark retained:",
  "若這份 PDF 已經由本機管理工具寫入永久浮水印，網站預覽與下載仍會顯示該浮水印。": "If the local admin tool already embedded a permanent watermark, it will remain visible in online preview and downloads.",
  "公開 PDF 預覽與免費下載頁面。": "Public PDF preview and free-download page.",
  "找不到你要的頁面": "Page Not Found",
  "這個網址可能已變更，或是檔案尚未上傳完成。": "The address may have changed, or the file may not have finished uploading.",
  "回到首頁": "Back to Home",
  "首頁": "Home",
  "6. 第三方平台、名稱與商標": "6. Third-Party Platforms, Names, and Trademarks",
  "使用條款與免責聲明｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Terms of Use & Disclaimer | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "隱私政策｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Privacy Policy | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "著作權與下架通知｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Copyright & Takedown Notice | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "PDF 預覽｜SR+SMC+VWAP 多空雙向教練": "PDF Preview | SR+SMC+VWAP Long/Short Trading Coach",
  "找不到頁面｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Page Not Found | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "打賞／贊助": "Support / Donate",
  "4. 瀏覽人次與下載次數計數工具": "4. Visitor and Download Counters",
  "本網站頁面頂端使用第三方 Visitor Badge 計數服務顯示累積頁面瀏覽人次，並使用 CounterAPI 記錄「免費下載」按鈕的累積點擊次數。載入或更新計數時，使用者的瀏覽器會直接向第三方服務提出請求，因此該服務可能依其系統運作處理 IP 位址、請求時間、瀏覽器或裝置等基本技術資訊。": "The site uses a third-party Visitor Badge service to display cumulative page views and CounterAPI to record clicks on free-download buttons. When counters load or update, the browser sends requests directly to those services, which may process basic technical information such as IP address, request time, browser, or device data.",
  "瀏覽計數不代表不重複訪客人數；下載計數代表下載按鈕被點擊，不保證檔案已完整下載。本網站仍未內建 Google Analytics、Meta Pixel、廣告追蹤或第三方行銷 Cookie；若日後加入其他分析、廣告或識別技術，應再更新本政策。": "Page-view counts do not represent unique visitors. Download counts record button clicks and do not guarantee a completed file download. The site does not currently embed Google Analytics, Meta Pixel, ad tracking, or third-party marketing cookies. This policy should be updated before adding such technologies."
};
  const attrMap = {
  "回到首頁": "Back to Home",
  "首頁": "Home",
  "6. 第三方平台、名稱與商標": "6. Third-Party Platforms, Names, and Trademarks",
  "使用條款與免責聲明｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Terms of Use & Disclaimer | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "隱私政策｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Privacy Policy | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "著作權與下架通知｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Copyright & Takedown Notice | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "PDF 預覽｜SR+SMC+VWAP 多空雙向教練": "PDF Preview | SR+SMC+VWAP Long/Short Trading Coach",
  "找不到頁面｜SR+SMC+VWAP 多空雙向教練 v6.6.9": "Page Not Found | SR+SMC+VWAP Long/Short Trading Coach v6.6.9",
  "網站操作": "Website Actions",
  "搜尋文章標題、摘要或分類...": "Search article titles, summaries, or categories...",
  "文章分類篩選": "Article category filters",
  "打賞與贊助連結": "Support and donation links",
  "切換深色模式": "Toggle dark mode",
  "官方連結": "Official links",
  "TradingView 與 Threads 連結": "TradingView and Threads links",
  "網站重點資訊": "Website highlights",
  "網站資料統計": "Website statistics",
  "精選手冊輪播預覽": "Featured manual slideshow",
  "上一張": "Previous slide",
  "下一張": "Next slide",
  "輪播頁面切換": "Slideshow navigation",
  "網站公告": "Website notice",
  "重要法律與風險提醒": "Important legal and risk notice",
  "分類篩選": "Category filter",
  "法律資訊": "Legal information",
  "關閉": "Close",
  "搜尋手冊名稱、分類、標籤或內容...": "Search title, category, tags, or content...",
  "PDF 預覽": "PDF Preview"
};

  const replaceTextNode = (node) => {
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed || !textMap[trimmed]) return;
    node.nodeValue = raw.replace(trimmed, textMap[trimmed]);
  };

  const translateTree = () => {
    if (!isEnglish) return;
    const rawTitle = document.title.trim();
    document.title = textMap[rawTitle] || rawTitle.replaceAll("SR+SMC+VWAP 多空雙向教練 v6.6.9", "SR+SMC+VWAP Long/Short Trading Coach v6.6.9").replaceAll("多空雙向教練", "Long/Short Trading Coach");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = "SR+SMC+VWAP Long/Short Trading Coach v6.6.9 manual library, Pine Script learning resources, previews, and free downloads.";
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const tag = node.parentElement?.tagName;
        if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(tag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
    document.querySelectorAll("[aria-label], [title], [placeholder]").forEach(el => {
      ["aria-label", "title", "placeholder"].forEach(name => {
        const value = el.getAttribute(name);
        if (value && attrMap[value]) el.setAttribute(name, attrMap[value]);
      });
    });
  };

  const addLanguageButton = () => {
    const target = document.querySelector(".header-actions") || document.querySelector(".site-header");
    if (!target) return;
    let button = document.querySelector("#languageToggle");
    if (!button) {
      button = document.createElement("button");
      button.id = "languageToggle";
      button.className = "button button-language";
      button.type = "button";
      target.append(button);
    }
    button.textContent = isEnglish ? "中文" : "EN";
    button.setAttribute("aria-label", isEnglish ? "Switch to Traditional Chinese" : "切換為英文");
    button.title = isEnglish ? "Switch to Traditional Chinese" : "Switch to English";
    button.onclick = () => {
      localStorage.setItem(STORAGE_KEY, isEnglish ? "zh-Hant" : "en");
      window.location.reload();
    };
  };

  document.addEventListener("DOMContentLoaded", () => {
    translateTree();
    addLanguageButton();
  });
})();
