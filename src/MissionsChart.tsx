import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import type { LeaderboardData } from './App'
import { parseDetails } from './App'

const BUCKET_COLORS = ['#4a3f6b', '#7b6fa0', '#b09fd0', '#e8c96a']
const BUCKET_LABELS = ['0/3', '1/3', '2/3', '3/3']

interface Props {
  data: LeaderboardData | null
}

export default function MissionsChart({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    chartRef.current?.destroy()
    chartRef.current = null

    if (!data || !canvasRef.current) return

    const counts = [0, 0, 0, 0]
    for (const entry of data.entries) {
      const m = parseDetails(entry.details).missions
      if (m >= 0 && m <= 3) counts[m]++
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: BUCKET_LABELS,
        datasets: [
          {
            data: counts,
            backgroundColor: BUCKET_COLORS,
            borderColor: BUCKET_COLORS.map((c) => c + 'cc'),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} player${ctx.parsed.y !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#c9c0d8' },
            grid: { color: '#2a2035' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#c9c0d8',
              precision: 0,
            },
            grid: { color: '#2a2035' },
            title: { display: true, text: 'Players', color: '#c9c0d8' },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Missions Completed{data ? ` — ${data.date}` : ''}</h3>
      {data ? (
        <div className="chart-canvas-wrapper">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <p className="status">No data</p>
      )}
    </div>
  )
}
