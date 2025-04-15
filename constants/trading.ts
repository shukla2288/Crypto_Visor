export interface TradingPair {
  symbol: string;
  name: string;
  binanceSymbol: string;
}

export const tradingPairs: TradingPair[] = [
  { symbol: "BTCUSDT", name: "BTC-USD", binanceSymbol: "BTCUSDT" },
  { symbol: "ETHUSDT", name: "ETH-USD", binanceSymbol: "ETHUSDT" },
  { symbol: "XRPUSDT", name: "XRP-USD", binanceSymbol: "XRPUSDT" },
];
