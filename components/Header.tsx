"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradingPair } from "@/constants/trading";

interface HeaderProps {
  selectedPair: {
    name: string;
    symbol: string;
  };
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export default function Header({ selectedPair, connectionStatus }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  const updateTime = useCallback(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }));
  }, []);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  return (
    <header className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            CryptoVisor
          </h1>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-gray-500'
            } animate-pulse`} />
            <span className="text-sm text-gray-400 capitalize">{connectionStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {currentTime}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Trading Pair:</span>
            <span className="text-sm font-medium text-white">{selectedPair.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
