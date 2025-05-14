"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Minus } from "lucide-react"
import SpreadIndicator from "@/components/SpreadIndicator"
import OrderbookImbalance from "@/components/OrderbookImbalance"
import MarketDepth from "@/components/MarketDepth"
import OrderBook from "@/components/OrderBook"
import { tradingPairs, TradingPair } from "@/constants/trading"

// Interface for an individual order book entry
interface OrderBookEntry {
  price: number
  amount: number
  total: number
  change: number
}

// Interface for the order book data
interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

// Interface for spread history entry
interface SpreadHistoryEntry {
  time: number
  spread: number
}

// Type definitions for WebSocket handlers
type WebSocketSetup = () => (() => void) | undefined
type OrderBookUpdate = (bids: [string, string][], asks: [string, string][]) => void
type MessageHandler = (event: MessageEvent) => void

export default function TradingView() {
  // State
  const [orderBookData, setOrderBookData] = useState<OrderBookData>({
    bids: [],
    asks: [],
  })
  const [spreadHistory, setSpreadHistory] = useState<SpreadHistoryEntry[]>([])
  const [imbalance, setImbalance] = useState<number>(0)
  const [selectedPair, setSelectedPair] = useState<TradingPair>(tradingPairs[0])
  const [loading, setLoading] = useState<boolean>(true)
  const [openFAQs, setOpenFAQs] = useState<number[]>([])

  // Refs for WebSocket and data processing
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const prevOrderBookRef = useRef<OrderBookData>({ bids: [], asks: [] })

  // Enhanced WebSocket connection status tracking
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const connectionAttemptsRef = useRef<number>(0)

  // Add connection queue management
  const connectionQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)

  // Add performance monitoring
  const performanceRef = useRef({
    lastCleanup: 0,
    messageCount: 0,
    lastMessageTime: 0
  })

  const reconnectRef = useRef<() => void>()

  // Enhanced cleanup with better memory management and performance checks
  const cleanup = useCallback(() => {
    const now = Date.now()
    // Prevent too frequent cleanups
    if (now - performanceRef.current.lastCleanup < 1000) return
    performanceRef.current.lastCleanup = now

    if (wsRef.current) {
      try {
        // Remove all listeners first
        wsRef.current.onclose = null
        wsRef.current.onerror = null
        wsRef.current.onmessage = null
        wsRef.current.onopen = null
        
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, "Cleanup")
        }
      } catch {
        // Silent cleanup
      }
      wsRef.current = null
    }

    // Clear all timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }
    
    // Reset all refs and state
    connectionAttemptsRef.current = 0
    lastUpdateRef.current = 0
    prevOrderBookRef.current = { bids: [], asks: [] }
    performanceRef.current.messageCount = 0
    performanceRef.current.lastMessageTime = 0
    setConnectionStatus('disconnected')
  }, [])

  // Process price level with better error handling and price normalization
  const processPriceLevel = useCallback((level: [string, string]) => {
    if (!Array.isArray(level) || level.length !== 2) {
      return null
    }

    try {
      let price = parseFloat(level[0])
      const amount = parseFloat(level[1])

      if (isNaN(price) || isNaN(amount)) {
        return null
      }

      // Normalize price for XRP-USD pair
      if (selectedPair.symbol === 'XRP-USD' && price > 1000) {
        price = price / 40000
      }

      return { price, amount }
    } catch {
      return null
    }
  }, [selectedPair.symbol])

  // Process orders with improved error handling
  const processOrders = useCallback((orders: [string, string][]) => {
    if (!Array.isArray(orders)) {
      console.error("Invalid orders format:", orders)
      return []
    }

    try {
      const validOrders = orders
        .map(processPriceLevel)
        .filter((order): order is { price: number; amount: number } => order !== null)
        .sort((a, b) => b.price - a.price)

      // Ensure we don't exceed the maximum number of orders
      return validOrders.slice(0, 20)
    } catch {
      console.error("Error processing orders")
      return []
    }
  }, [processPriceLevel])

  // Calculate totals with improved error handling
  const calculateTotals = useCallback((orders: { price: number; amount: number }[]) => {
    if (!Array.isArray(orders)) {
      console.error("Invalid orders array:", orders)
      return []
    }

    try {
      let runningTotal = 0
      return orders.map(order => {
        if (typeof order.amount !== 'number' || isNaN(order.amount)) {
          console.error("Invalid order amount:", order)
          return { ...order, total: runningTotal, change: 0 }
        }
        runningTotal += order.amount
        return {
          ...order,
          total: runningTotal,
          change: 0 // Will be updated later
        }
      })
    } catch {
      console.error("Error calculating totals")
      return []
    }
  }, [])

  // Calculate imbalance separately to reduce complexity
  const calculateImbalance = useCallback((orderBook: OrderBookData) => {
    const bidVolume = orderBook.bids.reduce((sum, bid) => sum + (bid.amount || 0), 0)
    const askVolume = orderBook.asks.reduce((sum, ask) => sum + (ask.amount || 0), 0)
    const totalVolume = bidVolume + askVolume
    return totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0
  }, [])

  // Update order book with optimized performance and throttling
  const updateOrderBook: OrderBookUpdate = useCallback((bids, asks) => {
    const now = Date.now()
    
    // Strict throttling to prevent excessive updates
    if (now - lastUpdateRef.current < 500) return
    lastUpdateRef.current = now

    // Check message frequency
    performanceRef.current.messageCount++
    const timeSinceLastMessage = now - performanceRef.current.lastMessageTime
    performanceRef.current.lastMessageTime = now

    // If receiving too many messages too quickly, reconnect
    if (performanceRef.current.messageCount > 100 && timeSinceLastMessage < 1000) {
      cleanup()
      setTimeout(() => {
        if (wsRef.current === null) {
          reconnectRef.current?.()
        }
      }, 1000)
      return
    }

    // Reset message count every second
    if (timeSinceLastMessage > 1000) {
      performanceRef.current.messageCount = 0
    }

    try {
      const processedBids = processOrders(bids)
      const processedAsks = processOrders(asks)
      
      if (processedBids.length === 0 && processedAsks.length === 0) {
        return
      }

      const bidsWithTotals = calculateTotals(processedBids)
      const asksWithTotals = calculateTotals(processedAsks)

      const newOrderBook = {
        bids: bidsWithTotals.map((bid, i) => ({
          ...bid,
          change: prevOrderBookRef.current.bids[i] ? bid.amount - prevOrderBookRef.current.bids[i].amount : 0
        })),
        asks: asksWithTotals.map((ask, i) => ({
          ...ask,
          change: prevOrderBookRef.current.asks[i] ? ask.amount - prevOrderBookRef.current.asks[i].amount : 0
        }))
      }

      const bestBid = newOrderBook.bids[0]?.price || 0
      const bestAsk = newOrderBook.asks[0]?.price || 0
      const spread = Math.max(0, bestAsk - bestBid)

      prevOrderBookRef.current = newOrderBook

      // Use a single state update to prevent excessive renders
      requestAnimationFrame(() => {
        setOrderBookData(newOrderBook)
        setSpreadHistory(prev => {
          const newEntry = { time: now, spread }
          return prev.length >= 60 ? [...prev.slice(-59), newEntry] : [...prev, newEntry]
        })
        setImbalance(calculateImbalance(newOrderBook))
      })
    } catch {
      // Silent error handling
    }
  }, [processOrders, calculateTotals, cleanup, calculateImbalance])

  // Enhanced WebSocket message handler with rate limiting
  const handleMessage: MessageHandler = useCallback((event) => {
    try {
      const data = JSON.parse(event.data)
      if (!data) return

      // Handle ping/pong messages
      if (data.ping) {
        wsRef.current?.send(JSON.stringify({ pong: data.ping }))
        return
      }

      const currentSymbol = selectedPair.binanceSymbol.toLowerCase()

      // Process depth update with validation
      if (data.e === 'depthUpdate') {
        if (data.s && data.s.toLowerCase() !== currentSymbol) return
        const { b: bids, a: asks } = data
        if (Array.isArray(bids) && Array.isArray(asks)) {
          updateOrderBook(bids, asks)
        }
      } 
      // Process snapshot with validation
      else if (Array.isArray(data.bids) && Array.isArray(data.asks)) {
        if (wsRef.current?.url.includes(currentSymbol)) {
          updateOrderBook(data.bids, data.asks)
        }
      }
    } catch {
      // Silent error handling
    }
  }, [updateOrderBook, selectedPair.binanceSymbol])

  // Enhanced WebSocket setup with better connection management
  const setupWebSocket: WebSocketSetup = useCallback(() => {
    cleanup()
    setLoading(true)
    setConnectionStatus('connecting')

    try {
      const binanceSymbol = selectedPair.binanceSymbol.toLowerCase()
      const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@depth20@100ms`

      const ws = new WebSocket(wsUrl)
      
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          cleanup()
          setConnectionStatus('error')
          setLoading(false)
          reconnectTimeoutRef.current = setTimeout(() => reconnectRef.current?.(), 3000)
        }
      }, 5000)

      ws.onopen = () => {
        clearTimeout(connectionTimeout)
        setLoading(false)
        setConnectionStatus('connected')
        
        // Setup periodic ping with error handling
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ method: "ping" }))
            } catch {
              clearInterval(pingInterval)
              if (ws.readyState === WebSocket.OPEN) {
                ws.close()
              }
            }
          } else {
            clearInterval(pingInterval)
          }
        }, 15000)

        updateTimeoutRef.current = pingInterval as unknown as NodeJS.Timeout
      }

      ws.onmessage = (event) => {
        // Only process messages if this is still the current connection
        if (ws === wsRef.current) {
          handleMessage(event)
        }
      }

      ws.onerror = () => {
        clearTimeout(connectionTimeout)
        cleanup()
        setConnectionStatus('error')
        setLoading(false)
        reconnectTimeoutRef.current = setTimeout(() => reconnectRef.current?.(), 3000)
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout)
        cleanup()
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => reconnectRef.current?.(), 3000)
        }
      }

      wsRef.current = ws

    } catch {
      cleanup()
      setConnectionStatus('error')
      setLoading(false)
      reconnectTimeoutRef.current = setTimeout(() => reconnectRef.current?.(), 3000)
    }

    return () => {
      cleanup()
    }
  }, [selectedPair, handleMessage, cleanup])

  // WebSocket reconnection function
  const reconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setupWebSocket()
  }, [setupWebSocket])

  // Store the reconnection function in the ref
  useEffect(() => {
    reconnectRef.current = reconnectWebSocket
  }, [reconnectWebSocket])

  // Process connection queue with performance monitoring
  const processConnectionQueue = useCallback(async () => {
    if (isProcessingRef.current || connectionQueueRef.current.length === 0) return

    isProcessingRef.current = true
    const nextPair = connectionQueueRef.current[0]

    try {
      cleanup()
      
      // Reset states
      setOrderBookData({ bids: [], asks: [] })
      setSpreadHistory([])
      setImbalance(0)
      
      const newPair = tradingPairs.find(pair => pair.symbol === nextPair)
      if (newPair) {
        setSelectedPair(newPair)
        await new Promise(resolve => setTimeout(resolve, 500))
        setupWebSocket()
      }
    } finally {
      connectionQueueRef.current = connectionQueueRef.current.slice(1)
      isProcessingRef.current = false
      
      // Process next in queue if any
      if (connectionQueueRef.current.length > 0) {
        setTimeout(processConnectionQueue, 500)
      }
    }
  }, [cleanup, setupWebSocket])

  // Enhanced pair change handler with queue management
  const handlePairChange = useCallback((value: string) => {
    const newPair = tradingPairs.find(pair => pair.symbol === value)
    if (!newPair || newPair.symbol === selectedPair.symbol) return

    // Add to connection queue
    connectionQueueRef.current.push(value)
    
    // Start processing if not already processing
    if (!isProcessingRef.current) {
      processConnectionQueue()
    }
  }, [selectedPair.symbol, processConnectionQueue])

  // Initialize WebSocket connection with proper cleanup
  useEffect(() => {
    const cleanupFn = setupWebSocket()
    return () => {
      cleanupFn?.()
      cleanup()
      // Clear connection queue on unmount
      connectionQueueRef.current = []
      isProcessingRef.current = false
    }
  }, [setupWebSocket, cleanup])

  // Memoize components to prevent unnecessary re-renders
  const memoizedSpreadIndicator = useMemo(() => (
    <SpreadIndicator loading={loading} spreadHistory={spreadHistory} />
  ), [loading, spreadHistory])

  const memoizedOrderbookImbalance = useMemo(() => (
    <OrderbookImbalance imbalance={imbalance} />
  ), [imbalance])

  const memoizedMarketDepth = useMemo(() => (
    <MarketDepth loading={loading} orderBookData={orderBookData} />
  ), [loading, orderBookData])

  const memoizedOrderBook = useMemo(() => (
    <OrderBook loading={loading} orderBookData={orderBookData} selectedPair={selectedPair} />
  ), [loading, orderBookData, selectedPair])

  const toggleFAQ = (index: number) => {
    setOpenFAQs(current =>
      current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button and Header Section */}
        <div className="mb-8 flex flex-col space-y-6">
          <div className="flex items-center justify-between backdrop-blur-md bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
            <Link 
              href="/" 
              className="group flex items-center px-4 py-2 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/50 hover:border-blue-500/50 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors mr-2" />
              <span className="text-gray-400 group-hover:text-blue-400 transition-colors font-medium">Back to Home</span>
            </Link>
            <div className={`px-6 py-2 rounded-xl flex items-center space-x-2 backdrop-blur-sm border transition-all duration-300 ${
              connectionStatus === 'connected' 
                ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-lg shadow-green-500/10' 
                : connectionStatus === 'connecting' 
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/10'
                : 'bg-red-500/10 text-red-400 border-red-500/30 shadow-lg shadow-red-500/10'
            }`}>
              <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                connectionStatus === 'connected' 
                  ? 'bg-green-400' 
                  : connectionStatus === 'connecting' 
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`} />
              <span className="font-medium tracking-wide">
                {connectionStatus === 'connected' 
                  ? 'Connected' 
                  : connectionStatus === 'connecting' 
                  ? 'Connecting...'
                  : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="text-center py-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-lg">
              {selectedPair.name} Trading View
            </h1>
            <p className="mt-2 text-gray-400">Real-time market data and analysis</p>
          </div>
        </div>

        {/* Trading Pair Selection */}
        <div className="mb-8 p-6 bg-gray-800/30 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-lg">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <h2 className="text-lg font-medium text-gray-300 mr-4">Trading Pairs</h2>
              <div className="flex flex-wrap gap-3">
                {tradingPairs.map((pair) => (
                  <button
                    key={pair.symbol}
                    onClick={() => handlePairChange(pair.symbol)}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      selectedPair.symbol === pair.symbol
                        ? "bg-blue-600/90 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 border border-blue-400/30"
                        : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white border border-gray-600/30 hover:border-gray-500/30"
                    }`}
                    disabled={loading}
                  >
                    {pair.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trading Features */}
          <div className="lg:col-span-2 space-y-6">
            {/* First Row - Spread Indicator */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Spread Indicator - {selectedPair.name}
              </h3>
              {memoizedSpreadIndicator}
            </div>

            {/* Second Row - Orderbook Imbalance */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-4 bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Orderbook Imbalance - {selectedPair.name}
              </h3>
              {memoizedOrderbookImbalance}
            </div>

            {/* Third Row - Market Depth */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Market Depth - {selectedPair.name}
              </h3>
              {memoizedMarketDepth}
            </div>

            {/* Fourth Row - Order Book */}
            <div className="bg-gray-800/30 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Order Book - {selectedPair.name}
              </h3>
              {memoizedOrderBook}
            </div>
          </div>

          {/* Right Column - FAQ Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                Trading Guide & FAQs
              </h2>
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {[
                  {
                    question: "What is an Order Book?",
                    answer: "An order book is the core component of cryptocurrency exchanges that displays real-time lists of buy (bids) and sell (asks) orders. It shows pending trade orders organized by price levels, helping traders understand current market dynamics, liquidity depth, and potential price movements. The spread between the highest bid and lowest ask indicates market efficiency."
                  },
                  {
                    question: "How to Read Market Depth?",
                    answer: "Market depth visualizes the cumulative volume of orders at different price levels. The chart shows buy orders (bids) on one side and sell orders (asks) on the other. Steeper curves indicate less price impact for large orders, while flatter curves suggest higher price volatility. This helps traders assess potential price impacts of their trades and identify potential support/resistance levels."
                  },
                  {
                    question: "Understanding Order Book Imbalance",
                    answer: "Order book imbalance measures the difference between buying and selling pressure in the market. A positive imbalance (more bids than asks) suggests bullish pressure, while negative imbalance indicates bearish pressure. This metric helps traders anticipate potential price movements and market sentiment. The imbalance percentage ranges from -100% (extremely bearish) to +100% (extremely bullish)."
                  },
                  {
                    question: "What Does Spread Indicate?",
                    answer: "The spread is the difference between the best bid (highest buy order) and best ask (lowest sell order) prices. A tight spread indicates high liquidity and efficient price discovery, while a wide spread suggests lower liquidity and higher trading costs. Spread patterns over time can reveal market volatility and trading opportunities. Our spread indicator tracks this metric historically to show market efficiency trends."
                  },
                  {
                    question: "How to Use Real-Time Market Data?",
                    answer: "Real-time market data provides crucial insights for trading decisions. Watch for sudden changes in order book depth (potential large trades), significant imbalances (price movement signals), and spread widening/tightening (liquidity changes). Combine these indicators with other technical analysis tools for more informed trading decisions. Our platform updates data every 100ms for accurate market representation."
                  },
                  {
                    question: "Understanding Trading Pairs",
                    answer: "Trading pairs represent the exchange rate between two cryptocurrencies or a cryptocurrency and fiat currency. For example, BTC-USD shows Bitcoin's price in US dollars. Each pair has unique characteristics like volatility, liquidity, and typical spread ranges. Consider these factors when choosing trading pairs, as they affect trading costs and potential opportunities."
                  },
                  {
                    question: "What are Price Levels?",
                    answer: "Price levels in the order book show where buyers and sellers are willing to trade. Strong price levels with large order volumes often act as support (for bids) or resistance (for asks). Watch for price level changes and order clustering to identify potential market turning points. Our order book display highlights significant price levels and volume concentrations."
                  }
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="group bg-gray-800/30 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-4 flex items-center justify-between cursor-pointer"
                    >
                      <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors text-left pr-4">
                        {faq.question}
                      </h3>
                      <div className={`ml-4 p-2 rounded-full transition-all duration-300 ${
                        openFAQs.includes(index) 
                          ? "bg-blue-500/20 rotate-180" 
                          : "bg-gray-700/50"
                      }`}>
                        {openFAQs.includes(index) ? (
                          <Minus className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-400" />
                        )}
                      </div>
                    </button>
                    {openFAQs.includes(index) && (
                      <div className="px-4 pb-4 text-gray-300 border-t border-gray-700/50 mt-2 pt-4 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
