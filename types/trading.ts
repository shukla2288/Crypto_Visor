export interface PriceLevel {
  price: number;
  amount: number;
  total: number;
  change: number;
}

export interface OrderBookData {
  bids: PriceLevel[];
  asks: PriceLevel[];
}

export interface TradingPair {
  symbol: string;
  name: string;
}
