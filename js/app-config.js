// app-config.js

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("settings-modal");
  const openBtn = document.getElementById("btn-open-settings");
  const closeBtn = document.getElementById("btn-close-modal");
  const saveLayoutBtn = document.getElementById("btn-save-layout");
  const resetAllBtn = document.getElementById("reset-all-btn");
  const saveStatusMsg = document.getElementById("save-status-msg");

  // バックアップ用要素
  const exportBtn = document.getElementById("btn-export-json");
  const importTrigger = document.getElementById("btn-import-trigger");
  const importInput = document.getElementById("input-import-json");

  const lang = localStorage.getItem("display-lang") || "ja";

  // --- 1. モーダル基本制御 ---
  if (openBtn && modal) {
    openBtn.onclick = (e) => {
      e.preventDefault();
      modal.style.display = "block";
    };
  }
  if (closeBtn)
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
  };

  // --- 2. 配置の保存 ---
  if (saveLayoutBtn) {
    saveLayoutBtn.onclick = () => {
      const allContainers = document.querySelectorAll(".widget-container");
      const currentLayout = Array.from(allContainers)
        .map((container) => ({
          name: container.dataset.tickerName || "",
          symbol: container.dataset.symbol || "",
          type: container.dataset.itemType || "",
          region: container.dataset.region || "",
        }))
        .filter((item) => item.name !== "");

      localStorage.setItem(
        "user_dashboard_layout",
        JSON.stringify(currentLayout),
      );

      if (saveStatusMsg) {
        saveStatusMsg.style.display = "inline";
        setTimeout(() => {
          saveStatusMsg.style.display = "none";
        }, 2000);
      }
    };
  }

  // --- 3. 【修正】完全な初期化（リセット） ---
  if (resetAllBtn) {
    resetAllBtn.onclick = () => {
      const msg =
        lang === "ja"
          ? "配置とお気に入りをすべて削除し、初期状態に戻しますか？"
          : "Reset all layouts and favorites to default?";
      if (confirm(msg)) {
        localStorage.removeItem("user_dashboard_layout");
        localStorage.removeItem("market-favs"); // お気に入りも削除
        window.location.reload();
      }
    };
  }

  // --- 4. エクスポート (JSON) ---
  if (exportBtn) {
    exportBtn.onclick = () => {
      const backupData = {
        layout: JSON.parse(
          localStorage.getItem("user_dashboard_layout") || "[]",
        ),
        favorites: JSON.parse(localStorage.getItem("market-favs") || "[]"),
        settings: {
          mode: localStorage.getItem("display-mode"),
          lang: localStorage.getItem("display-lang"),
          theme: localStorage.getItem("display-theme"),
        },
        version: "1.0",
        date: new Date().toLocaleString(),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // --- 5. インポート (JSON) ---
  if (importTrigger && importInput) {
    importTrigger.onclick = () => importInput.click();

    importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (
            confirm(
              lang === "ja"
                ? "ファイルから設定を復元しますか？現在の設定は上書きされます。"
                : "Restore settings from file? Current settings will be overwritten.",
            )
          ) {
            if (data.layout)
              localStorage.setItem(
                "user_dashboard_layout",
                JSON.stringify(data.layout),
              );
            if (data.favorites)
              localStorage.setItem(
                "market-favs",
                JSON.stringify(data.favorites),
              );
            if (data.settings) {
              if (data.settings.mode)
                localStorage.setItem("display-mode", data.settings.mode);
              if (data.settings.lang)
                localStorage.setItem("display-lang", data.settings.lang);
              if (data.settings.theme)
                localStorage.setItem("display-theme", data.settings.theme);
            }
            window.location.reload();
          }
        } catch (err) {
          alert(
            lang === "ja"
              ? "ファイルの読み込みに失敗しました。"
              : "Failed to load file.",
          );
        }
      };
      reader.readAsText(file);
    };
  }
});
