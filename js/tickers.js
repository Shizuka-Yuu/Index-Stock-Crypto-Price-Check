// js/tickers.js
const tickers = [
  // --- TradingView 銘柄 ---
  { id: "nas100", name: "NAS100(CFD)", symbol: "FOREXCOM:NAS100" },
  { id: "ni225", name: "日経先物", symbol: "OSE:NK2251!" },
  { id: "us500", name: "S%P500(CFD)", symbol: "US500" },
  { id: "dji", name: "NYダウ", symbol: "AMEX:DIA" },
  { id: "usdjpy", name: "USDJPY", symbol: "USDJPY" },
  { id: "nvda", name: "NVDA", symbol: "NASDAQ:NVDA" },
  { id: "aapl", name: "AAPL", symbol: "NASDAQ:AAPL" },
  { id: "tsla", name: "TSLA", symbol: "NASDAQ:TSLA" },
  { id: "msft", name: "MSFT", symbol: "NASDAQ:MSFT" },
  { id: "sox", name: "SOX", symbol: "NASDAQ:SOX" },
  { id: "sony", name: "SONY", symbol: "NYSE:SONY" },
  { id: "btc", name: "BTC", symbol: "BINANCE:BTCUSDT" },
  { id: "vix", name: "VIX(Future)", symbol: "CAPITALCOM:VIX" },
  { id: "gold", name: "GOLD", symbol: "TVC:GOLD" },
  { id: "oil", name: "OIL", symbol: "TVC:USOIL" },
  { id: "ni225(cfd)", name: "NI225(CFD)", symbol: "FOREXCOM:JP225" },

  // --- スプレッドシート（独自）銘柄 ---
  // スプレッドシート銘柄：symbolにGoogleFinanceのコードを入れる
  // スプレッドシートの A列（名前）と name を一致させる
  {
    id: "sheet_sp500",
    name: "S&P500",
    type: "sheet",
    symbol: ".INX:INDEXSP",
  },
  {
    id: "sheet_vix",
    name: "VIX(Spot)",
    type: "sheet",
    symbol: "VIX:INDEXCBOE",
  },
  {
    id: "sheet_nas100",
    name: "NAS100",
    type: "sheet",
    symbol: "NAS100",
  },
  {
    id: "sheet_ni225",
    name: "NI225",
    type: "sheet",
    symbol: "NI225:INDEXNIKKEI",
  },
  {
    id: "sheet_us2y",
    name: "US2Y",
    type: "sheet",
    symbol: "rates-bonds/u.s.-2-year-bond-yield",
  },
  {
    id: "sheet_us5y",
    name: "US5Y",
    type: "sheet",
    symbol: "rates-bonds/u.s.-5-year-bond-yield",
  },
  {
    id: "sheet_us10y",
    name: "US10Y",
    type: "sheet",
    symbol: "rates-bonds/u.s.-10-year-bond-yield",
  },
  {
    id: "sheet_us30y",
    name: "US30Y",
    type: "sheet",
    symbol: "rates-bonds/u.s.-30-year-bond-yield",
  },
  {
    id: "sheet_jgb2y",
    name: "JGB2Y",
    type: "sheet",
    symbol: "rates-bonds/japan-2-year-bond-yield",
  },
  {
    id: "sheet_jgb5y",
    name: "JGB5Y",
    type: "sheet",
    symbol: "rates-bonds/japan-5-year-bond-yield",
  },
  {
    id: "sheet_jgb10y",
    name: "JGB10Y",
    type: "sheet",
    symbol: "rates-bonds/japan-10-year-bond-yield",
  },
  {
    id: "sheet_jgb30y",
    name: "JGB30Y",
    type: "sheet",
    symbol: "rates-bonds/japan-30-year-bond-yield",
  },
  {
    id: "sheet_btcusd",
    name: "BTCUSD",
    type: "sheet",
    symbol: "BTC-USD",
  },
];
