import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ArrowDownUp, Book, TrendingDown, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  change: number;
}

interface OrderBookProps {
  loading: boolean;
  orderBookData: {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  };
  selectedPair?: {
    symbol: string;
    name: string;
  };
}

export default function OrderBook({ loading, orderBookData, selectedPair }: OrderBookProps) {
  const [groupingSize, setGroupingSize] = useState<number>(0.5);
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<"both" | "bids" | "asks">("both");

  // Get the base and quote currency from the trading pair
  const [baseCurrency, quoteCurrency] = selectedPair?.symbol.split('-') || ['', ''];

  // Calculate maximum total for percentage bars
  const maxTotal = useMemo(() => {
    const maxBidTotal = Math.max(...orderBookData.bids.map((bid) => bid.total));
    const maxAskTotal = Math.max(...orderBookData.asks.map((ask) => ask.total));
    return Math.max(maxBidTotal, maxAskTotal);
  }, [orderBookData]);

  // Format number with appropriate decimals based on trading pair
  const formatNumber = (num: number, type: 'price' | 'amount' | 'total' = 'amount') => {
    if (!num) return '0.00';
    
    // Get decimals based on type and trading pair
    let decimals = 8;
    if (type === 'price') {
      if (selectedPair?.symbol.includes('USD')) {
        decimals = 2;
      } else if (selectedPair?.symbol.includes('BTC')) {
        decimals = 8;
      } else if (selectedPair?.symbol.includes('ETH')) {
        decimals = 6;
      }
    }

    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Format number with appropriate decimals based on trading pair
  const formatPrice = (price: number) => {
    if (!price) return '0.00';
    
    // Get decimals based on trading pair
    let decimals = 2; // Default for USD pairs
    
    // Handle Binance WebSocket price normalization
    let normalizedPrice = price;
    if (selectedPair?.symbol.includes('XRP-USD') && price > 1000) {
      normalizedPrice = price / 40000; // Normalize the price for XRP-USD
    }
    
    if (selectedPair?.symbol.includes('BTC')) {
      decimals = 8;
    } else if (selectedPair?.symbol.includes('ETH')) {
      decimals = 6;
    } else if (selectedPair?.symbol.includes('XRP')) {
      decimals = 4;
    }

    return normalizedPrice.toFixed(decimals);
  };

  // Calculate price change color and icon
  const getPriceChangeInfo = (change: number) => {
    if (change > 0) {
      return { color: "text-green-500", icon: <TrendingUp className="h-3 w-3" /> };
    } else if (change < 0) {
      return { color: "text-red-500", icon: <TrendingDown className="h-3 w-3" /> };
    }
    return { color: "text-gray-500", icon: null };
  };

  const renderOrderRow = (order: OrderBookEntry, side: "bid" | "ask") => {
    const percentage = (order.total / maxTotal) * 100;
    const { color, icon } = getPriceChangeInfo(order.change);
    const isHovered = hoveredPrice === order.price;

    return (
      <motion.div
        key={order.price}
        initial={{ opacity: 0, x: side === "bid" ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: side === "bid" ? -20 : 20 }}
        className={`relative grid grid-cols-3 text-sm py-1.5 px-3 cursor-pointer border-l-2 ${
          isHovered ? "bg-gray-700/50" : "bg-transparent"
        } ${
          side === "bid" 
            ? "border-l-green-500/20 hover:border-l-green-500" 
            : "border-l-red-500/20 hover:border-l-red-500"
        }`}
        onMouseEnter={() => setHoveredPrice(order.price)}
        onMouseLeave={() => setHoveredPrice(null)}
      >
        {/* Background percentage bar */}
        <div
          className={`absolute top-0 left-0 h-full ${
            side === "bid" ? "bg-green-500/5" : "bg-red-500/5"
          }`}
          style={{ width: `${percentage}%` }}
        />

        {/* Price */}
        <div className={`relative z-10 ${side === "bid" ? "text-green-500" : "text-red-500"} font-medium`}>
          {formatPrice(order.price)}
          {icon && <span className="ml-1 inline-block">{icon}</span>}
        </div>

        {/* Amount */}
        <div className="relative z-10 text-right text-gray-300">
          {formatNumber(order.amount, 'amount')}
        </div>

        {/* Total */}
        <div className="relative z-10 text-right text-gray-400">
          {formatNumber(order.total, 'total')}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 shadow-xl h-[calc(100vh-12rem)] max-h-[800px] min-h-[600px] overflow-hidden">
      <CardHeader className="pb-3 border-b border-gray-700/50 sticky top-0 z-30 bg-gray-800/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="h-6 w-6 text-amber-500" />
            <CardTitle className="text-xl font-bold text-gray-100">
              Order Book
              {selectedPair && (
                <span className="ml-2 text-sm text-gray-400">
                  {selectedPair.name}
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {/* Display Mode Toggle */}
            <div className="flex bg-gray-700/50 rounded-lg p-1.5">
              <button
                onClick={() => setDisplayMode("both")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-300 ${
                  displayMode === "both"
                    ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-600/50"
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setDisplayMode("bids")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-300 ${
                  displayMode === "bids"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-600/50"
                }`}
              >
                Bids
              </button>
              <button
                onClick={() => setDisplayMode("asks")}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-300 ${
                  displayMode === "asks"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-600/50"
                }`}
              >
                Asks
              </button>
            </div>

            {/* Group Size Selector */}
            <select
              value={groupingSize}
              onChange={(e) => setGroupingSize(parseFloat(e.target.value))}
              className="bg-gray-700/50 text-gray-300 text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
            >
              <option value={0.1}>Group 0.1</option>
              <option value={0.5}>Group 0.5</option>
              <option value={1}>Group 1.0</option>
              <option value={2}>Group 2.0</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-[calc(100%-4rem)] relative">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <div className="h-full flex flex-col divide-y divide-gray-700/50">
            {/* Asks (Sell Orders) - Scrollable */}
            {(displayMode === "both" || displayMode === "asks") && (
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="sticky top-0 z-20 grid grid-cols-3 text-sm font-medium text-gray-400 px-4 py-2 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
                  <div>Price</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="space-y-px">
                  {orderBookData.asks.map((ask) => (
                    <div
                      key={ask.price}
                      className="relative grid grid-cols-3 text-sm py-1.5 px-4 hover:bg-gray-700/30"
                    >
                      <div className="absolute inset-0 bg-red-500/5" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
                      <div className="relative z-10 text-red-400 font-medium tabular-nums">
                        {formatPrice(ask.price)}
                      </div>
                      <div className="relative z-10 text-right text-gray-300 tabular-nums">
                        {formatNumber(ask.amount)}
                      </div>
                      <div className="relative z-10 text-right text-gray-400 tabular-nums">
                        {formatNumber(ask.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spread Indicator - Sticky */}
            {displayMode === "both" && (
              <div className="sticky z-10 flex items-center justify-between py-2 px-4 bg-gray-700/30 backdrop-blur-sm">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Spread: {formatPrice(orderBookData.asks[0]?.price - orderBookData.bids[0]?.price)}
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {((orderBookData.asks[0]?.price - orderBookData.bids[0]?.price) / orderBookData.asks[0]?.price * 100).toFixed(2)}%
                </Badge>
              </div>
            )}

            {/* Bids (Buy Orders) - Scrollable */}
            {(displayMode === "both" || displayMode === "bids") && (
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="sticky top-0 z-20 grid grid-cols-3 text-sm font-medium text-gray-400 px-4 py-2 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
                  <div>Price</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="space-y-px">
                  {orderBookData.bids.map((bid) => (
                    <div
                      key={bid.price}
                      className="relative grid grid-cols-3 text-sm py-1.5 px-4 hover:bg-gray-700/30"
                    >
                      <div className="absolute inset-0 bg-emerald-500/5" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
                      <div className="relative z-10 text-emerald-400 font-medium tabular-nums">
                        {formatPrice(bid.price)}
                      </div>
                      <div className="relative z-10 text-right text-gray-300 tabular-nums">
                        {formatNumber(bid.amount)}
                      </div>
                      <div className="relative z-10 text-right text-gray-400 tabular-nums">
                        {formatNumber(bid.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
