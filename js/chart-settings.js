// chart-settings.js

// 1. 状態管理
let currentMode = localStorage.getItem("display-mode") || "simple";
let currentLang = localStorage.getItem("display-lang") || "ja";
let currentTheme =
  localStorage.getItem("display-theme") ||
  (window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark");

// 2. 切り替え関数
function changeMode(mode) {
  localStorage.setItem("display-mode", mode);
  window.location.reload();
}

function changeLang(lang) {
  localStorage.setItem("display-lang", lang);
  window.location.reload();
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("display-theme", currentTheme);
  window.location.reload();
}

function applyTheme() {
  if (currentTheme === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
}

/**
 * TradingViewのModuleスクリプトを動的に注入する関数
 */
function injectTVModule(lang) {
  const scriptId = "tv-mini-chart-script";
  if (document.getElementById(scriptId)) return;

  const script = document.createElement("script");
  script.id = scriptId;
  script.type = "module";
  // currentLangに合わせて ja か en のパスを動的に生成
  script.src = `https://widgets.tradingview-widget.com/w/${lang}/tv-mini-chart.js`;
  document.head.appendChild(script);
}

// 3. メインの初期化関数
async function initDashboard() {
  const favGrid = document.getElementById("favorite-grid");
  const allGrid = document.getElementById("chart-grid");

  // --- 1. 保存されたレイアウトを読み込み、新旧銘柄を統合する ---
  const savedLayout = JSON.parse(
    localStorage.getItem("user_dashboard_layout") || "null",
  );

  let displayTickers;
  if (savedLayout && Array.isArray(savedLayout)) {
    // A. まず、キャッシュにある順序で tickers.js から詳細情報を引き出す
    displayTickers = savedLayout
      .map((savedItem) => {
        return tickers.find((t) => t.name === savedItem.name);
      })
      .filter((item) => item !== undefined); // tickers.jsから削除されたものは除外

    // B. 【重要】tickers.js にあって、キャッシュ（displayTickers）に無い銘柄を探す
    const newItems = tickers.filter(
      (t) => !displayTickers.some((d) => d.name === t.name),
    );

    // C. 新しい銘柄があれば末尾に追加する
    if (newItems.length > 0) {
      console.log("New tickers detected and added to the end:", newItems);
      displayTickers = [...displayTickers, ...newItems];
    }
  } else {
    // キャッシュがなければデフォルトをそのまま使用
    displayTickers = [...tickers];
  }

  const tvLang = currentLang === "ja" ? "ja" : "en";
  injectTVModule(tvLang);
  applyTheme();

  if (typeof fetchSheetData === "function") {
    await fetchSheetData();
  }

  // UIラベル設定（省略せず保持）
  const uiLabels = {
    ja: { settings: "⚙️ 設定", single: "Single", mini: "Mini", rich: "Rich" },
    en: {
      settings: "⚙️ Settings",
      single: "Single",
      mini: "Mini",
      rich: "Rich",
    },
  }[currentLang];
  const settingsBtn = document.getElementById("btn-open-settings");
  if (settingsBtn) settingsBtn.innerText = uiLabels.settings;

  if (favGrid) favGrid.innerHTML = "";
  if (allGrid) allGrid.innerHTML = "";

  const savedFavs = JSON.parse(localStorage.getItem("market-favs") || "[]");

  // 2. 描画ループ
  displayTickers.forEach((item) => {
    if (!item || !item.name) return;

    const itemId = item.id || item.name.replace(/\s+/g, "_");
    const boxId = `box_${itemId}`;

    const box = document.createElement("div");
    box.className = `chart-box view-${currentMode}`;
    box.id = boxId;

    const header = document.createElement("div");
    header.className = "chart-header";
    header.innerText = `⠿ ${item.name}`;

    // 削除ボタン等のロジック（省略せず保持）
    const langData = {
      ja: {
        drag: "ドラッグで並べ替え",
        delete: "削除",
        confirm: `${item.name} を削除しますか？`,
      },
      en: {
        drag: "Drag to reorder",
        delete: "Remove",
        confirm: `Remove ${item.name}?`,
      },
    }[currentLang];
    header.title = langData.drag;
    if (savedFavs.includes(boxId)) {
      const deleteBtn = document.createElement("span");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerText = "×";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (window.confirm(langData.confirm)) {
          const nextFavs = savedFavs.filter((id) => id !== boxId);
          localStorage.setItem("market-favs", JSON.stringify(nextFavs));
          initDashboard();
        }
      };
      header.appendChild(deleteBtn);
    }

    const container = document.createElement("div");
    container.className = "widget-container";

    // スキャン用dataset
    container.dataset.tickerName = item.name;
    container.dataset.symbol = item.symbol;
    container.dataset.itemType = item.type;
    container.dataset.region = item.region || "US";

    const cover = document.createElement("div");
    cover.className = "click-cover";
    cover.onclick = (e) => {
      e.stopPropagation();
      const url = (() => {
        // Investing.comのパスがsymbolに入っている場合
        if (item.symbol.includes("/")) {
          return `https://www.investing.com/${item.symbol}`;
        }

        return item.type === "sheet"
          ? `https://www.google.com/finance/quote/${item.symbol}`
          : `https://tradingview.com/symbols/${item.symbol}/`;
      })();

      window.open(url, "_blank");
    };

    container.appendChild(cover);
    box.appendChild(header);
    box.appendChild(container);

    if (savedFavs.includes(boxId)) {
      favGrid.appendChild(box);
    } else {
      allGrid.appendChild(box);
    }

    // 3. 【重要】描画タイミングの調整
    // DOMが親（favGrid/allGrid）に追加された直後に描画関数を呼ぶ
    if (item.type === "sheet") {
      if (typeof renderSheetContent === "function") {
        renderSheetContent(container, item, currentTheme);
      }
    } else {
      // TVウィジェットはブラウザのレンダリングを一度待ってから流し込む
      requestAnimationFrame(() => {
        renderTVWidget(container, item);
      });
    }
  });

  updateButtonStates();
  updateFavoriteGuide();
}

function renderTVWidget(container, item) {
  if (currentMode === "single") {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: item.symbol,
      width: "100%",
      colorTheme: currentTheme,
      isTransparent: true,
      lang: currentLang,
    });
    container.appendChild(script);
  } else if (currentMode === "simple") {
    const miniTag = document.createElement("tv-mini-chart");
    miniTag.setAttribute("symbol", item.symbol);
    miniTag.setAttribute("line-chart-type", "Baseline");
    miniTag.setAttribute("dateRange", "1D");
    miniTag.setAttribute("show-time-range", "");
    miniTag.setAttribute("show-time-scale", "");
    miniTag.setAttribute("no-auto-fit", "");
    miniTag.setAttribute("theme", currentTheme);
    miniTag.setAttribute("width", "100%");
    miniTag.setAttribute("height", "100%");
    miniTag.setAttribute("lang", currentLang);
    miniTag.setAttribute("locale", currentLang);
    container.appendChild(miniTag);
  } else {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: item.symbol,
      width: "100%",
      height: "100%",
      lang: currentLang,
      dateRange: "1D",
      colorTheme: currentTheme,
      isTransparent: true,
      autosize: true,
      largeChart: false,
    });
    container.appendChild(script);
  }
}

setTimeout(adjustMiniChartFont, 1000);

function updateButtonStates() {
  document
    .querySelectorAll(".mode-selector button, .lang-selector button")
    .forEach((btn) => btn.classList.remove("active"));
  const btnIds = {
    [currentMode]: `btn-${currentMode}`,
    [currentLang]: `btn-${currentLang}`,
  };
  Object.values(btnIds).forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.add("active");
  });
}

function updateFavoriteGuide() {
  const favGrid = document.getElementById("favorite-grid");
  if (!favGrid) return;
  const msg =
    currentLang === "ja" ? "ここにチャートをドラッグ" : "Drag charts here";
  favGrid.classList.toggle(
    "empty-guide",
    favGrid.getElementsByClassName("chart-box").length === 0,
  );
  favGrid.setAttribute("data-guide-msg", msg);
}

document.addEventListener("DOMContentLoaded", initDashboard);

function adjustMiniChartFont() {
  console.log("Font adjusted");
}
