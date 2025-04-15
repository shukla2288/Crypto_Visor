"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";
import { motion } from "framer-motion";

interface OrderbookImbalanceProps {
  imbalance: number;
}

export default function OrderbookImbalance({
  imbalance,
}: OrderbookImbalanceProps) {
  // Convert imbalance to percentage for display
  const imbalancePercentage = Math.round(imbalance * 100);
  
  // Determine color based on imbalance
  const getImbalanceColor = () => {
    if (imbalancePercentage > 0) {
      return {
        text: "text-emerald-400",
        bg: "from-emerald-500/20 to-emerald-500/5",
        border: "border-emerald-500/20",
        slider: "bg-gradient-to-r from-emerald-500 to-emerald-400"
      };
    } else if (imbalancePercentage < 0) {
      return {
        text: "text-red-400",
        bg: "from-red-500/20 to-red-500/5",
        border: "border-red-500/20",
        slider: "bg-gradient-to-r from-red-500 to-red-400"
      };
    }
    return {
      text: "text-amber-400",
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/20",
      slider: "bg-gradient-to-r from-amber-500 to-amber-400"
    };
  };

  const colors = getImbalanceColor();

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className={`h-5 w-5 ${colors.text}`} />
            <CardTitle className="text-lg font-bold text-gray-100">
              Orderbook Imbalance
            </CardTitle>
          </div>
          <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${colors.bg} ${colors.border} border`}>
            <span className={`font-medium ${colors.text}`}>
              {Math.abs(imbalancePercentage)}% {imbalancePercentage >= 0 ? "Buy" : "Sell"} Pressure
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-4 bg-gray-700/50 rounded-full overflow-hidden">
          {/* Center line */}
          <div className="absolute inset-y-0 left-1/2 w-px bg-gray-600" />
          
          {/* Imbalance indicator */}
          <motion.div
            initial={{ width: "50%" }}
            animate={{
              width: `${50 + (imbalancePercentage / 2)}%`,
              transition: { duration: 0.5, ease: "easeOut" }
            }}
            className={`absolute inset-y-0 left-0 ${colors.slider} shadow-lg`}
            style={{
              boxShadow: `0 0 20px ${imbalancePercentage > 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
            }}
          />

          {/* Gradient overlays for depth effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/10 to-transparent pointer-events-none" />
        </div>

        {/* Scale markers */}
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>100% Sell</span>
          <span>Neutral</span>
          <span>100% Buy</span>
        </div>
      </CardContent>
    </Card>
  );
}
