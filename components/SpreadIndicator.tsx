"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
import { TrendingUp, TrendingDown } from "lucide-react"
import { ApexOptions } from 'apexcharts'

// Dynamically import ApexCharts to avoid SSR issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface SpreadHistoryEntry {
  time: number
  spread: number
}

interface ChartDataPoint {
  x: number
  y: number
}

interface ChartSeries {
  name: string
  data: ChartDataPoint[]
}

interface ChartData {
  series: ChartSeries[]
  options: ApexOptions
}

interface SpreadIndicatorProps {
  loading: boolean
  spreadHistory: SpreadHistoryEntry[]
  className?: string
}

export default function SpreadIndicator({ loading, spreadHistory, className = "" }: SpreadIndicatorProps) {
  const [chartData, setChartData] = useState<ChartData>({
    series: [
      {
        name: "Spread",
        data: []
      }
    ],
    options: {
      chart: {
        type: "area",
        height: 200,
        animations: {
          enabled: true,
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "transparent",
        foreColor: "#94a3b8"
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
              opacity: 0.8
            },
            {
              offset: 100,
              color: "#8b5cf6",
              opacity: 0.2
            }
          ]
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      grid: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        row: {
          colors: ["transparent", "transparent"],
          opacity: 0.5
        },
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 10
        }
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          size: 5,
          sizeOffset: 3
        }
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
          fontFamily: "inherit"
        },
        x: {
          show: true,
          formatter: (val: number) => {
            const date = new Date(val)
            return date.toLocaleTimeString()
          }
        },
        y: {
          formatter: (val: number) => {
            return val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          }
        },
        marker: {
          show: true
        }
      },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: (value: string) => {
            const date = new Date(parseInt(value))
            return date.toLocaleTimeString()
          },
          style: {
            colors: "#94a3b8",
            fontSize: "11px"
          }
        },
        axisBorder: {
          show: true,
          color: "rgba(255, 255, 255, 0.2)"
        },
        axisTicks: {
          show: true,
          color: "rgba(255, 255, 255, 0.2)"
        }
      },
      yaxis: {
        tickAmount: 4,
        labels: {
          formatter: (val: number) => {
            return val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          },
          style: {
            colors: "#94a3b8",
            fontSize: "11px"
          }
        },
        title: {
          text: "Spread",
          style: {
            fontSize: "12px",
            fontWeight: 500,
            color: "#94a3b8"
          }
        }
      },
      theme: {
        mode: "dark"
      }
    }
  })

  // Process data for the chart
  useEffect(() => {
    if (loading || !spreadHistory.length) return

    const data = spreadHistory.map((entry) => ({
      x: entry.time,
      y: entry.spread
    }))

    // Update chart colors based on trend
    const recentSpreads = spreadHistory.slice(-5).map(entry => entry.spread)
    const isIncreasing = recentSpreads.every((val, i) => i === 0 || val >= recentSpreads[i - 1])
    const isDecreasing = recentSpreads.every((val, i) => i === 0 || val <= recentSpreads[i - 1])

    let colors = ["#3b82f6"] // default blue
    let gradientStops = [
      {
        offset: 0,
        color: "#3b82f6",
        opacity: 0.8
      },
      {
        offset: 100,
        color: "#8b5cf6",
        opacity: 0.2
      }
    ]

    if (isIncreasing) {
      colors = ["#f43f5e"] // red for uptrend
      gradientStops = [
        {
          offset: 0,
          color: "#f43f5e",
          opacity: 0.8
        },
        {
          offset: 100,
          color: "#ec4899",
          opacity: 0.2
        }
      ]
    } else if (isDecreasing) {
      colors = ["#10b981"] // green for downtrend
      gradientStops = [
        {
          offset: 0,
          color: "#10b981",
          opacity: 0.8
        },
        {
          offset: 100,
          color: "#06b6d4",
          opacity: 0.2
        }
      ]
    }

    setChartData((prevState) => ({
      ...prevState,
      series: [
        {
          name: "Spread",
          data: data
        }
      ],
      options: {
        ...prevState.options,
        colors: colors,
        fill: {
          ...prevState.options.fill,
          gradient: {
            ...prevState.options.fill?.gradient,
            colorStops: gradientStops
          }
        }
      }
    }))
  }, [spreadHistory, loading])

  // Calculate spread statistics
  const currentSpread = spreadHistory[spreadHistory.length - 1]?.spread || 0
  const previousSpread = spreadHistory[spreadHistory.length - 2]?.spread || 0
  const spreadChange = currentSpread - previousSpread
  const spreadChangePercentage = previousSpread ? (spreadChange / previousSpread) * 100 : 0

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-primary text-lg sm:text-xl">Spread Indicator</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              Current: {currentSpread.toFixed(4)}
            </Badge>
            <Badge
              variant="outline"
              className={`${
                spreadChange >= 0
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}
            >
              {spreadChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(spreadChangePercentage).toFixed(2)}%
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
