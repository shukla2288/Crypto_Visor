"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, LineChart, Activity, Zap, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          >
            CryptoVisor
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl sm:text-2xl text-gray-300"
          >
            Advanced Crypto Trading Analytics Platform
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              href="/trading"
              className="inline-flex items-center px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/20"
            >
              Launch Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                Advanced Crypto Trading Analytics
              </h2>
              <p className="text-xl text-gray-400">
                Professional-grade tools for cryptocurrency market analysis
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg shadow-gray-900/50 hover:shadow-gray-900/70 transition-all duration-300">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <LineChart className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  Real-time Market Data
                </h3>
                <p className="text-gray-400">
                  Get instant access to live order book data, market depth, and trading indicators.
                </p>
              </div>

              <div className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg shadow-gray-900/50 hover:shadow-gray-900/70 transition-all duration-300">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                  Advanced Analytics
                </h3>
                <p className="text-gray-400">
                  Analyze market trends with our comprehensive trading tools and indicators.
                </p>
              </div>

              <div className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 shadow-lg shadow-gray-900/50 hover:shadow-gray-900/70 transition-all duration-300">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-pink-500/10 mb-4 group-hover:bg-pink-500/20 transition-colors">
                  <Zap className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-pink-400 transition-colors">
                  Lightning Fast Updates
                </h3>
                <p className="text-gray-400">
                  Experience ultra-low latency updates with our optimized WebSocket connection.
                </p>
              </div>
            </div>

            {/* Information Section */}
            <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700 shadow-lg shadow-gray-900/50">
                <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Why Choose CryptoVisor?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">Professional Tools</h4>
                      <p className="text-gray-400">Access institutional-grade trading analytics and market data visualization tools.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-purple-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">Real-time Data</h4>
                      <p className="text-gray-400">Stay ahead with live order book updates and market depth analysis.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-pink-500 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">User-Friendly Interface</h4>
                      <p className="text-gray-400">Intuitive design that makes complex market data easy to understand.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 border border-gray-700 shadow-lg shadow-gray-900/50">
                <h3 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Getting Started
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                      <span className="text-blue-400 font-semibold">1</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">Select Trading Pair</h4>
                      <p className="text-gray-400">Choose from our selection of major cryptocurrency trading pairs.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                      <span className="text-purple-400 font-semibold">2</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">Analyze Market Data</h4>
                      <p className="text-gray-400">Use our comprehensive tools to analyze market trends and patterns.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center mr-4">
                      <span className="text-pink-400 font-semibold">3</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-1">Make Informed Decisions</h4>
                      <p className="text-gray-400">Use real-time insights to make better trading decisions.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
