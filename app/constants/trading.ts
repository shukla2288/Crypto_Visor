export interface TradingPair {
  name: string
  symbol: string
  binanceSymbol: string
}

export const tradingPairs: TradingPair[] = [
  {
    name: "BTC-USD",
    symbol: "BTC-USD",
    binanceSymbol: "btcusdt"
  },
  {
    name: "ETH-USD",
    symbol: "ETH-USD",
    binanceSymbol: "ethusdt"
  },
  {
    name: "XRP-USD",
    symbol: "XRP-USD",
    binanceSymbol: "xrpusdt"
  }
] 