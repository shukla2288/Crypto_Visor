"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
import { TrendingUp, TrendingDown } from "lucide-react"

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface OrderBookEntry {
  price: number
  amount: number
  total: number
  change: number
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

interface MarketDepthProps {
  loading: boolean
  orderBookData: OrderBookData
  className?: string
}

export default function MarketDepth({ loading, orderBookData, className = "" }: MarketDepthProps) {
  const [chartData, setChartData] = useState<any>({
    series: [
      {
        name: "Bids",
        data: [],
      },
      {
        name: "Asks",
        data: [],
      },
    ],
    options: {
      chart: {
        type: "area",
        height: 200,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
          },
          autoSelected: "zoom",
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        background: "transparent",
        foreColor: "#94a3b8",
      },
      colors: ["#10b981", "#f43f5e"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      grid: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        row: {
          colors: ["transparent", "transparent"],
          opacity: 0.5,
        },
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10,
        },
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          size: 5,
          sizeOffset: 3,
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
          fontFamily: "inherit",
        },
        x: {
          show: true,
          formatter: (val: number) => `Price: ${val.toFixed(2)}`,
        },
        y: {
          formatter: (val: number) => `Volume: ${val.toFixed(4)}`,
        },
        marker: {
          show: true,
        },
      },
      xaxis: {
        type: "numeric",
        labels: {
          formatter: (val: number) => val.toFixed(2),
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
        axisBorder: {
          show: true,
          color: "rgba(255, 255, 255, 0.2)",
        },
        axisTicks: {
          show: true,
          color: "rgba(255, 255, 255, 0.2)",
        },
      },
      yaxis: {
        tickAmount: 4,
        labels: {
          formatter: (val: number) => val.toFixed(4),
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
        title: {
          text: "Volume",
          style: {
            fontSize: "12px",
            fontWeight: 500,
            color: "#94a3b8",
          },
        },
      },
      theme: {
        mode: "dark",
      },
    },
  })

  // Process data for the chart
  useEffect(() => {
    if (loading || !orderBookData.bids.length || !orderBookData.asks.length) return

    const bidsData = orderBookData.bids.map((bid) => ({
      x: bid.price,
      y: bid.total,
    }))

    const asksData = orderBookData.asks.map((ask) => ({
      x: ask.price,
      y: ask.total,
    }))

    setChartData((prevState: any) => ({
      ...prevState,
      series: [
        {
          name: "Bids",
          data: bidsData,
        },
        {
          name: "Asks",
          data: asksData,
        },
      ],
    }))
  }, [orderBookData, loading])

  // Calculate total volumes
  const totalBidVolume = orderBookData.bids.reduce((sum, bid) => sum + bid.amount, 0)
  const totalAskVolume = orderBookData.asks.reduce((sum, ask) => sum + ask.amount, 0)
  const volumeRatio = totalBidVolume / (totalBidVolume + totalAskVolume)

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-primary text-lg sm:text-xl">Market Depth</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <TrendingUp className="h-3 w-3 mr-1" /> Bids: {totalBidVolume.toFixed(4)}
            </Badge>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">
              <TrendingDown className="h-3 w-3 mr-1" /> Asks: {totalAskVolume.toFixed(4)}
            </Badge>
            <Badge
              variant="outline"
              className={`${
                volumeRatio > 0.5
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}
            >
              Ratio: {(volumeRatio * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Spinner />
          </div>
        ) : (
          <div className="h-[200px] w-full">
            {typeof window !== "undefined" && (
              <ReactApexChart
                options={chartData.options}
                series={chartData.series}
                type="area"
                height={200}
                width="100%"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
