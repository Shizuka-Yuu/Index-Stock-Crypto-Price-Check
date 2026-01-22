/**
 * sheet-data-handler.js
 */

import { checkSingleCardStatus } from "./live-monitor.js";

let sheetDataCache = {};
let isWorkerDown = false; // Workerが死んでいるかどうかのフラグ
let lastWorkerRetry = 0; // 最後にWorkerを試した時間
const RETRY_INTERVAL = 5 * 60 * 1000; // 5分間はCSV固定

const WORKER_URL = "https://market-data-backend.shizuka-y.workers.dev/";
const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbvCN-TxegvvgReZKPlV11iFE8MSSvPEvUsiVJS5_p25G59uTigeCAwuFnvsrLtoRqSMxbCc7TrIRj/pub?gid=0&single=true&output=csv";

export async function fetchSheetData() {
  const now = Date.now();

  if (isWorkerDown && now - lastWorkerRetry < RETRY_INTERVAL) {
    console.log("Worker is resting... Mode: CSV (Fallback)");
    await fetchFromCSV();
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(WORKER_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Cloudflare Limit/Error");

    const data = await response.json();
    sheetDataCache = {};
    data.forEach((item) => {
      if (item.name) {
        sheetDataCache[item.name] = [
          item.name,
          item.symbol,
          item.price,
          item.close,
          item.chgval,
          item.chgpct,
          item.history,
          item.timestamp,
        ];
      }
    });

    isWorkerDown = false;
    console.log("Data source: Workers (JSON)");
    window.dispatchEvent(new CustomEvent("sheetDataUpdated"));
  } catch (e) {
    isWorkerDown = true;
    lastWorkerRetry = now;
    console.warn("Worker failure detected. Switching to CSV for 10 minutes.");
    await fetchFromCSV();
  }
}

async function fetchFromCSV() {
  try {
    const csvRes = await fetch(CSV_URL);
    if (!csvRes.ok) throw new Error("Google CSV also failed");

    const csvText = await csvRes.text();
    const rows = csvText.split("\n").filter((row) => row.trim() !== "");

    sheetDataCache = {};
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",");
      if (cols.length >= 8) {
        const name = cols[0].trim();
        sheetDataCache[name] = [
          cols[0],
          cols[1],
          cols[2],
          cols[3],
          cols[4],
          cols[5],
          cols[6],
          cols[7],
        ];
      }
    }
    window.dispatchEvent(new CustomEvent("sheetDataUpdated"));
  } catch (err) {
    console.error("Critical: Everything is down.", err);
  }
}

export function renderSheetContent(container, item, theme) {
  const data = sheetDataCache[item.name];
  if (!data) return;

  const [name, symbol, price, close, chgVal, chgPct, historyStr, timestamp] =
    data;

  // 既存のコンテナを探す
  let contentWrapper = container.querySelector(".sheet-card-inner-content");

  // 重要：前回の価格を dataset から取得
  const lastPrice = contentWrapper ? contentWrapper.dataset.lastRawPrice : null;

  if (!contentWrapper) {
    contentWrapper = document.createElement("div");
    contentWrapper.className = "sheet-card-inner-content csv-data-present";
    contentWrapper.style.cssText = `padding:12px;height:100%;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;pointer-events:none;`;
    container.appendChild(contentWrapper);
  }

  const isUp = parseFloat(chgVal) >= 0;
  const color = isUp ? "#089981" : "#f23645";
  const textColor = theme === "light" ? "#131722" : "#d1d4dc";

  const formatPriceHTML = (priceStr) => {
    if (!priceStr || !priceStr.includes(".")) return priceStr;
    const [integer, fraction] = priceStr.split(".");
    return `${integer}<span style="font-size: 0.65em; opacity: 0.85; margin-left: 0.05em;">.${fraction}</span>`;
  };

  const formattedPrice = formatPriceHTML(price);

  // フラッシュ判定（生数値文字列の比較）
  let flashType = null;
  if (lastPrice && lastPrice !== price) {
    const vOld = parseFloat(lastPrice.replace(/,/g, ""));
    const vNew = parseFloat(price.replace(/,/g, ""));
    if (vNew > vOld) flashType = "up";
    else if (vNew < vOld) flashType = "down";
    console.log(
      `Flash Triggered: ${name} | Old: ${vOld} | New: ${vNew} | Type: ${flashType}`,
    );
  }

  // 状態の保存
  contentWrapper.dataset.lastRawPrice = price;
  contentWrapper.dataset.timestamp = timestamp;
  contentWrapper.dataset.tickerName = item.name;
  contentWrapper.dataset.symbol = item.symbol;
  contentWrapper.dataset.view = item.view;

  // HTML更新（transitionをインラインから削除）
  contentWrapper.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div class="price-val" style="font-size:1.5rem;font-weight:bold;color:${textColor};">${formattedPrice}</div>
        <div style="text-align:right;line-height:1.2;">
            <div style="color:${color};font-size:0.85rem;font-weight:bold;">${isUp ? "▲" : "▼"} ${Math.abs(chgVal)}</div>
            <div style="color:${color};font-size:0.85rem;font-weight:bold;">${chgPct}</div>
        </div>
    </div>
    <canvas class="sparkline-canvas" style="width:100%;height:45px;margin-top:10px;"></canvas>
    <div class="card-survival-footer" style="margin-top:auto;padding-top:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#888;font-family:monospace;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span class="status-lamp" style="width:6px;height:6px;border-radius:50%;background:#089981;box-shadow:0 0 4px #089981;"></span>
                <span class="live-counter">00:00</span>
            </div>
            <div class="last-fetch-time">${timestamp || "--:--:--"}</div>
        </div>
        <div style="width:100%;height:2px;background:rgba(255,255,255,0.1);margin-top:4px;overflow:hidden;">
            <div class="fetch-progress-bar" style="width:0%;height:100%;background:#089981;transition:width 1s linear;"></div>
        </div>
    </div>`;

  // フラッシュの実行
  if (flashType) {
    const flashColor = flashType === "up" ? "#089981" : "#f23645";
    // 確実に要素が配置されるのを待つ
    requestAnimationFrame(() => {
      const newPriceEl = contentWrapper.querySelector(".price-val");
      flashPriceColor(newPriceEl, flashColor, textColor);
    });
  }

  checkSingleCardStatus(contentWrapper);

  if (historyStr) {
    const canvas = contentWrapper.querySelector(".sparkline-canvas");
    const numericData = historyStr
      .split("|")
      .map((s) => Number(s.split("#")[0]))
      .filter((n) => !isNaN(n));

    if (numericData.length > 0) {
      requestAnimationFrame(() => renderSparkline(canvas, numericData, color));
    }
  }
}

function flashPriceColor(el, flashColor, originalColor) {
  if (!el) return;

  // 1. transitionを完全に無効化し、即座にフラッシュ色に変える
  el.style.setProperty("transition", "none", "important");
  el.style.setProperty("color", flashColor, "important");

  // 2. 0.5秒後に、再びtransitionなしで元の色にパッと戻す
  setTimeout(() => {
    el.style.setProperty("transition", "none", "important");
    el.style.setProperty("color", originalColor, "important");
  }, 500); // 0.5秒間維持
}

function renderSparkline(canvas, data, color) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = rect.width;
  const h = rect.height - 10;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";

  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((val - min) / range) * h + 5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.lineTo(w, rect.height);
  ctx.lineTo(0, rect.height);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, rect.height);
  grad.addColorStop(0, color + "33");
  grad.addColorStop(1, color + "00");
  ctx.fillStyle = grad;
  ctx.fill();
}
