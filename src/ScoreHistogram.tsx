import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import type { LeaderboardData } from './App'

const BIN_COUNT = 10
const BAR_COLOR = '#7ec8e3'

interface Props {
  data: LeaderboardData | null
}

function niceStep(rawStep: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

export default function ScoreHistogram({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    chartRef.current?.destroy()
    chartRef.current = null

    if (!data || data.entries.length < 2 || !canvasRef.current) return

    const scores = data.entries.map((e) => e.displayScore)
    const min = Math.min(...scores)
    const max = Math.max(...scores)

    const step = niceStep((max - min) / BIN_COUNT)
    const binMin = Math.floor(min / step) * step
    const binCount = Math.ceil((max - binMin) / step) + 1

    const counts = Array(binCount).fill(0)
    for (const s of scores) {
      const idx = Math.min(Math.floor((s - binMin) / step), binCount - 1)
      counts[idx]++
    }

    const labels = counts.map((_, i) => {
      const lo = binMin + i * step
      const hi = lo + step
      return `${lo.toLocaleString()}–${hi.toLocaleString()}`
    })

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: BAR_COLOR + '99',
            borderColor: BAR_COLOR,
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
            ticks: {
              color: '#c9c0d8',
              maxRotation: 45,
              autoSkip: true,
            },
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
      <h3 className="chart-title">Score Distribution{data ? ` — ${data.date}` : ''}</h3>
      {data && data.entries.length >= 2 ? (
        <div className="chart-canvas-wrapper">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <p className="status">No data</p>
      )}
    </div>
  )
}
