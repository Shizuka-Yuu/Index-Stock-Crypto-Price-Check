/**
 * live-monitor.js
 */
import { fetchSheetData } from "./sheet-data-handler.js";

const FETCH_INTERVAL_MS = 20 * 1000;
let lastFetchTime = Date.now();

/**
 * 監視システムの初期化
 */
export function initLiveMonitor() {
  // 起動時に全カードを一度チェック
  setTimeout(() => {
    updateAllMarketStatus();
  }, 1000);

  setInterval(() => {
    const now = Date.now();
    const diff = now - lastFetchTime;

    // カウンターとバーの描画更新
    updateSurvivalUI_withDiff(diff);

    // 定期フェッチの判定
    if (diff >= FETCH_INTERVAL_MS) {
      lastFetchTime = now;
      triggerDataRefresh();
    }
  }, 1000);
}

/**
 * 単体カードの鮮度チェック（sheet-data-handler.js からも呼び出される）
 */
export function checkSingleCardStatus(wrapper) {
  if (!wrapper) return;
  const tsString = wrapper.dataset.timestamp;
  if (!tsString) return;

  const NOW = new Date();
  const dataTime = new Date(tsString);
  const THRESHOLD_MS = 30 * 60 * 1000; // 30分
  const lamp = wrapper.querySelector(".status-lamp");

  if (isNaN(dataTime.getTime()) || NOW - dataTime > THRESHOLD_MS) {
    wrapper.classList.add("market-closed");
    if (lamp) {
      lamp.style.background = "#434651";
      lamp.style.boxShadow = "none";
    }
  } else {
    wrapper.classList.remove("market-closed");
    if (lamp) {
      lamp.style.background = "#089981";
      lamp.style.boxShadow = "0 0 4px #089981";
    }
  }
}

/**
 * 全カードのステータスを更新（内部用）
 */
function updateAllMarketStatus() {
  const contentWrappers = document.querySelectorAll(
    ".sheet-card-inner-content",
  );
  contentWrappers.forEach((wrapper) => {
    checkSingleCardStatus(wrapper);
  });
}

/**
 * UIの進行更新
 */
function updateSurvivalUI_withDiff(diffMs) {
  const elapsedSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = Math.min((diffMs / FETCH_INTERVAL_MS) * 100, 100);

  // 全てのカウンター要素に対してループ
  document.querySelectorAll(".live-counter").forEach((el) => {
    const contentWrapper = el.closest(".sheet-card-inner-content");
    const isClosed =
      contentWrapper && contentWrapper.classList.contains("market-closed");

    // 閉場中のカードなら、カウンターの数値を更新せずスキップ
    if (isClosed) return;

    el.innerText = timeStr;
  });

  // バー更新（ここは以前の通り）
  document.querySelectorAll(".fetch-progress-bar").forEach((bar) => {
    const contentWrapper = bar.closest(".sheet-card-inner-content");
    const isClosed =
      contentWrapper && contentWrapper.classList.contains("market-closed");

    if (isClosed) {
      bar.style.transition = "none";
      bar.style.width = "0%";
      return;
    }

    if (elapsedSeconds === 0) {
      bar.style.transition = "none";
      bar.style.width = "0%";
      void bar.offsetWidth; // reflow
      bar.style.transition = "width 1s linear";
    } else {
      bar.style.width = `${progress}%`;
    }
  });
}

/**
 * データの再取得
 */
async function triggerDataRefresh() {
  try {
    await fetchSheetData();
    updateAllMarketStatus();
    window.dispatchEvent(new CustomEvent("sheetDataUpdated"));
  } catch (e) {
    console.error("Live Monitor: Refresh Failed", e);
  }
}

window.initLiveMonitor = initLiveMonitor;
