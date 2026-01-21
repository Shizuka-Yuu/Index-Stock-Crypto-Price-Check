# Index-Stock-Crypto-Price-Check

├── css/
│   └── style.css
├── js/
│   ├── tickers.js
│   ├── chart-settings.js
│   ├── dashboard.js
│   ├── app-config.js
│   ├── sheet-data-handler.js
│   └── live-monitor.js
├── index.html
├── README.md
└── task.md

| **ファイル**                  | **役割要約**                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- |
| **index.html**            | **構造の定義**。外部ライブラリ（Sortable, TradingView）の読み込みと、2つの表示エリア（Favorites/Market）の骨組みを提供 |
| **style.css**             | **視覚と操作感の定義**                                                                    |
| **tickers.js**            | シンボル（銘柄）管理。スプレッドシート（独自カード）銘柄の管理。                                                 |
| **chart-settings.js**     | **データの生成と配置**。銘柄リストを基に、設定（シンプル/ミニ/リッチ）に応じたウィジェットをDOMとして動的に組み立て                   |
| **dashboard.js**          | **永続化とインタラクション**。ドラッグ＆ドロップによる並び替えを監視し、その結果をLocalStorageへ保存                       |
| **app-config.js**         | キャッシュ保存・削除。インポート/エクスポート                                                          |
| **sheet-data-handler.js** | Worker（CSV）からデータ取得、パース、そしてCanvasへの描画を担当                                          |
| **live-monitor.js**       | 画面の生存確認（タイマー）、市場判定、および定期fetchの管理を担当                                              |
