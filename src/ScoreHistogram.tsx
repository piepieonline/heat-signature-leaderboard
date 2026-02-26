import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js'
import type { LeaderboardData } from './App'

const BAR_COLOR = '#7ec8e3'
const STEP = 100
const MAX_SCORE = 600

interface Props {
  data: LeaderboardData | null
}


export default function ScoreHistogram({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    chartRef.current?.destroy()
    chartRef.current = null

    if (!data || data.entries.length < 2 || !canvasRef.current) return

    const scores = data.entries.map((e) => e.displayScore)

    // Buckets: [<0, 0–99, 100–199, 200–299, 300–399, 400–499, 500–599, 600]
    const positiveBucketCount = MAX_SCORE / STEP  // 6 buckets: 0-99..500-599
    const totalBuckets = 1 + positiveBucketCount + 1  // <0, 0–99..500–599, 600

    const counts = Array(totalBuckets).fill(0)
    for (const s of scores) {
      if (s < 0) {
        counts[0]++
      } else if (s >= MAX_SCORE) {
        counts[totalBuckets - 1]++
      } else {
        counts[1 + Math.floor(s / STEP)]++
      }
    }

    const labels = counts.map((_, i) => {
      if (i === 0) return `<0`
      if (i === totalBuckets - 1) return `${MAX_SCORE}`
      const lo = (i - 1) * STEP
      return `${lo}–${lo + STEP - 1}`
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
