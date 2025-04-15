"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface SpreadHistoryEntry {
  time: number
  spread: number
}

interface SpreadIndicatorProps {
  loading: boolean
  spreadHistory: SpreadHistoryEntry[]
}

export default function SpreadIndicator({ loading, spreadHistory }: SpreadIndicatorProps) {
  const [chartData, setChartData] = useState<any>({
    series: [
      {
        name: "Spread",
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
      colors: ["#3b82f6"],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: "#3b82f6",
              opacity: 0.8,
            },
            {
              offset: 100,
              color: "#8b5cf6",
              opacity: 0.2,
            },
          ],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 3,
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
          formatter: (val: number) => {
            const date = new Date(val)
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          },
        },
        y: {
          formatter: (val: number) => `Spread: ${val.toFixed(5)}`,
        },
        marker: {
          show: true,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          formatter: (val: number) => {
            const date = new Date(val)
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          },
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
          formatter: (val: number) => val.toFixed(5),
          style: {
            colors: "#94a3b8",
            fontSize: "11px",
          },
        },
        title: {
          text: "Spread Value",
          style: {
            fontSize: "12px",
            fontWeight: 500,
            color: "#94a3b8",
          },
        },
      },
      annotations: {
        yaxis: [
          {
            y: 0,
            strokeDashArray: 3,
            borderColor: "#f59e0b",
            label: {
              borderColor: "#f59e0b",
              style: {
                color: "#fff",
                background: "#f59e0b",
                fontSize: "10px",
                fontWeight: 400,
              },
              text: "Avg Spread",
            },
          },
        ],
      },
      theme: {
        mode: "dark",
      },
    },
  })

  // Calculate statistics
  const stats = useMemo(() => {
    if (!spreadHistory.length) return { min: 0, max: 0, avg: 0, current: 0, trend: "neutral" }

    const spreads = spreadHistory.map((entry) => entry.spread)
    const min = Math.min(...spreads)
    const max = Math.max(...spreads)
    const avg = spreads.reduce((sum, val) => sum + val, 0) / spreads.length
    const current = spreadHistory[spreadHistory.length - 1]?.spread || 0

    // Determine trend based on last 5 entries
    let trend = "neutral"
    if (spreadHistory.length >= 5) {
      const recentSpreads = spreadHistory.slice(-5).map((entry) => entry.spread)
      const increasing = recentSpreads.every((val, i) => i === 0 || val >= recentSpreads[i - 1])
      const decreasing = recentSpreads.every((val, i) => i === 0 || val <= recentSpreads[i - 1])

      if (increasing) trend = "up"
      else if (decreasing) trend = "down"
    }

    return { min, max, avg, current, trend }
  }, [spreadHistory])

  // Process data for the chart with improved performance
  useEffect(() => {
    if (loading || !spreadHistory.length) return

    try {
      // Ensure we have valid data points
      const validDataPoints = spreadHistory
        .filter(entry => typeof entry.time === 'number' && !isNaN(entry.time) && 
                        typeof entry.spread === 'number' && !isNaN(entry.spread))
        .slice(-60) // Limit to last 60 points

      if (validDataPoints.length === 0) return

      // Format data for ApexCharts
      const formattedData = validDataPoints.map(entry => ({
        x: entry.time,
        y: entry.spread
      }))

      // Update chart colors based on trend
      let colors = ["#3b82f6"] // default blue
      let gradientStops = [
        {
          offset: 0,
          color: "#3b82f6",
          opacity: 0.8,
        },
        {
          offset: 100,
          color: "#8b5cf6",
          opacity: 0.2,
        },
      ]

      if (stats.trend === "up") {
        colors = ["#f43f5e"] // red for uptrend
        gradientStops = [
          {
            offset: 0,
            color: "#f43f5e",
            opacity: 0.8,
          },
          {
            offset: 100,
            color: "#ec4899",
            opacity: 0.2,
          },
        ]
      } else if (stats.trend === "down") {
        colors = ["#10b981"] // green for downtrend
        gradientStops = [
          {
            offset: 0,
            color: "#10b981",
            opacity: 0.8,
          },
          {
            offset: 100,
            color: "#06b6d4",
            opacity: 0.2,
          },
        ]
      }

      // Update chart data with requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        setChartData(prevState => ({
          ...prevState,
          series: [
            {
              name: "Spread",
              data: formattedData,
            },
          ],
          options: {
            ...prevState.options,
            colors: colors,
            fill: {
              ...prevState.options.fill,
              gradient: {
                ...prevState.options.fill.gradient,
                colorStops: gradientStops,
              },
            },
            annotations: {
              yaxis: [
                {
                  y: stats.avg,
                  strokeDashArray: 3,
                  borderColor: "#f59e0b",
                  label: {
                    borderColor: "#f59e0b",
                    style: {
                      color: "#fff",
                      background: "#f59e0b",
                      fontSize: "10px",
                      fontWeight: 400,
                    },
                    text: `Avg: ${stats.avg.toFixed(5)}`,
                  },
                },
              ],
            },
          },
        }))
      })
    } catch (error) {
      console.error("Error updating chart data:", error)
    }
  }, [spreadHistory, loading, stats.avg, stats.trend])

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-primary flex items-center text-lg sm:text-xl">
            <ArrowUpDown className="mr-2" />
            Spread Indicator
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`${
                stats.trend === "up"
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  : stats.trend === "down"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-primary/10 border-primary/20"
              }`}
            >
              Current: {stats.current.toFixed(5)}
              {stats.trend === "up" && <TrendingUp className="ml-1 h-3 w-3 text-rose-500" />}
              {stats.trend === "down" && <TrendingDown className="ml-1 h-3 w-3 text-emerald-500" />}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              Min: {stats.min.toFixed(5)}
            </Badge>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">
              Max: {stats.max.toFixed(5)}
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              Avg: {stats.avg.toFixed(5)}
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
