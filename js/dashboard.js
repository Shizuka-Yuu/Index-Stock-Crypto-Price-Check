// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const options = {
    group: {
      name: "shared",
      pull: true,
      put: true,
    },
    animation: 150,
    handle: ".chart-header",
    fallbackOnBody: true,
    swapThreshold: 0.65,
    forceFallback: true,
    fallbackClass: "sortable-fallback",

    onStart: (evt) => {
      document.body.classList.add("is-dragging-active");
      evt.item.classList.add("is-dragging");
    },

    onEnd: (evt) => {
      document.body.classList.remove("is-dragging-active");
      evt.item.classList.remove("is-dragging");

      // --- 1. お気に入り状態（エリア分け）の保存 ---
      const favGrid = document.getElementById("favorite-grid");
      const favIds = Array.from(favGrid.querySelectorAll(".chart-box")).map(
        (el) => el.id,
      );
      localStorage.setItem("market-favs", JSON.stringify([...new Set(favIds)]));

      // --- 2. 【統合追加】全体の並び順（レイアウト）の自動保存 ---
      // ページ全体の全コンテナから現在の並び順をスキャンしてキャッシュします
      const allContainers = document.querySelectorAll(".widget-container");
      const currentLayout = Array.from(allContainers)
        .map((container) => ({
          name:
            container.dataset.tickerName || container.dataset.itemName || "",
          symbol: container.dataset.symbol || "",
          type: container.dataset.itemType || "",
          region:
            container.dataset.region || container.dataset.itemRegion || "",
        }))
        .filter((item) => item.name !== "");

      if (currentLayout.length > 0) {
        localStorage.setItem(
          "user_dashboard_layout",
          JSON.stringify(currentLayout),
        );
        console.log("Layout Auto-Saved");
      }

      // --- 3. 既存の動的UI更新ロジック ---
      const itemEl = evt.item;
      const header = itemEl.querySelector(".chart-header");
      const lang = localStorage.getItem("display-lang") || "ja";

      // 銘柄名をクリーンに取得
      const tickerName = header.innerText
        .replace("⠿ ", "")
        .split("×")[0]
        .trim();

      // 言語別メッセージ
      const messages = {
        ja: {
          drag: "ドラッグして並べ替え",
          delete: "お気に入りから削除",
          jump: `${tickerName} の詳細チャートを表示`,
          confirm: `${tickerName} をお気に入りから削除しますか？\n（下の Market Overview エリアに戻ります）`,
        },
        en: {
          drag: "Drag to reorder",
          delete: "Remove from favorites",
          jump: `View detailed chart for ${tickerName}`,
          confirm: `Remove ${tickerName} from favorites?\n(It will return to the Market Overview section.)`,
        },
      }[lang];

      // --- A: お気に入り（上位グリッド）へ移動した場合 ---
      if (evt.to.id === "favorite-grid") {
        // 既存のボタンを消去して重複を防ぐ
        header.querySelectorAll(".delete-btn").forEach((btn) => btn.remove());

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerText = "×";
        deleteBtn.title = messages.delete;

        // onclickに代入して上書きを保証
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (window.confirm(messages.confirm)) {
            const currentFavs = JSON.parse(
              localStorage.getItem("market-favs") || "[]",
            );
            const nextFavs = currentFavs.filter((id) => id !== itemEl.id);
            localStorage.setItem("market-favs", JSON.stringify(nextFavs));
            initDashboard(); // 再描画
          }
        };
        header.appendChild(deleteBtn);
        rebootWidget(itemEl); // ウィジェット再起動
      }

      // --- B: 元のエリア（下位グリッド）へ戻した場合 ---
      if (evt.to.id === "chart-grid") {
        header.querySelectorAll(".delete-btn").forEach((btn) => btn.remove());
        rebootWidget(itemEl);
      }

      // ツールチップ更新
      header.title = messages.drag;
      itemEl.title = messages.jump;

      if (typeof updateFavoriteGuide === "function") {
        updateFavoriteGuide();
      }
    },
  };

  // ウィジェットの再起動処理
  function rebootWidget(itemEl) {
    const container = itemEl.querySelector(".widget-container");
    if (!container) return;

    const iframe = container.querySelector("iframe");
    if (iframe) {
      iframe.src = iframe.src;
    } else {
      const chart = container.querySelector("tv-mini-chart");
      if (chart) {
        const clone = chart.cloneNode(true);
        chart.remove();
        container.appendChild(clone);
      }
    }
  }

  const favGridEl = document.getElementById("favorite-grid");
  const chartGridEl = document.getElementById("chart-grid");

  if (favGridEl && chartGridEl) {
    new Sortable(favGridEl, options);
    new Sortable(chartGridEl, options);
  }

  // ライブアップデート通知の受け取り
  window.addEventListener("sheetDataUpdated", () => {
    const theme = localStorage.getItem("display-theme") || "dark";

    document.querySelectorAll(".widget-container").forEach((container) => {
      const itemName =
        container.dataset.itemName || container.dataset.tickerName;
      const itemType = container.dataset.itemType;

      if (itemType === "sheet" && itemName) {
        const mockItem = {
          name: itemName,
          region:
            container.dataset.itemRegion || container.dataset.region || "US",
        };

        if (window.renderSheetContent) {
          window.renderSheetContent(container, mockItem, theme);
        }
      }
    });
  });
});

/**
 * ダッシュボードの状態を外部から取得するヘルパー関数
 */
window.getItemsFromDashboard = function () {
  const cards = document.querySelectorAll(".widget-container");
  const layout = Array.from(cards).map((card) => {
    return {
      name: card.dataset.tickerName || card.dataset.itemName,
      symbol: card.dataset.symbol,
      type: card.dataset.itemType,
    };
  });
  return layout;
};
