import { useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from 'chart.js'
import type { LeaderboardData } from './App'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip)

const COLORS = [
  '#e8c96a', '#7ec8e3', '#b57bee', '#e87a5a', '#7be87a',
  '#e8a06a', '#6ab4e8', '#e86ab5', '#a0e86a', '#e86a6a',
]

interface Props {
  dates: string[]
  dayData: (LeaderboardData | null)[]
}

function makeDatasets(
  players: { steamId: number; name: string }[],
  colors: string[],
  dayData: (LeaderboardData | null)[],
  validIndices: boolean[],
  getValue: (entry: LeaderboardData['entries'][number]) => number | null,
) {
  return players.map((player, idx) => {
    const color = colors[idx]
    return {
      label: player.name,
      borderColor: color,
      backgroundColor: color + '33',
      pointBackgroundColor: color,
      data: dayData
        .filter((_, i) => validIndices[i])
        .map((day) => {
          if (!day) return null
          const found = day.entries.find((e) => e.steamId === player.steamId)
          return found !== undefined ? getValue(found) : null
        }),
      // spanGaps: true, // TODO: This is too visually confusing
      tension: 0,
      pointRadius: 4,
      segment: {
        borderDash: (ctx: { p0DataIndex: number; p1DataIndex: number }) =>
          ctx.p1DataIndex - ctx.p0DataIndex > 1 ? [4, 4] : undefined,
      },
    }
  })
}

export default function TopPlayersChart({ dates, dayData }: Props) {
  const rankCanvasRef = useRef<HTMLCanvasElement>(null)
  const rankChartRef = useRef<Chart | null>(null)

  useEffect(() => {
    rankChartRef.current?.destroy()
    rankChartRef.current = null

    const validIndices = dates.map((_, i) => dayData[i] !== null)

    const seen = new Map<number, { steamId: number; name: string }>()
    for (const day of dayData) {
      if (!day) continue
      for (const entry of day.entries) {
        if (entry.rank <= 10 && !seen.has(entry.steamId)) {
          seen.set(entry.steamId, entry)
        }
      }
    }

    const appearances = new Map<number, number>()
    for (const day of dayData) {
      if (!day) continue
      for (const entry of day.entries) {
        if (entry.rank <= 10) {
          appearances.set(entry.steamId, (appearances.get(entry.steamId) ?? 0) + 1)
        }
      }
    }

    const players = Array.from(seen.values()).sort(
      (a, b) => (appearances.get(b.steamId) ?? 0) - (appearances.get(a.steamId) ?? 0)
    )

    if (players.length === 0 || !rankCanvasRef.current) return

    let colorIdx = 0
    const playerColors = players.map((p) =>
      (appearances.get(p.steamId) ?? 0) > 1 ? (COLORS[colorIdx++] ?? '#ffffff') : '#ffffff'
    )

    const labels = dates
      .filter((_, i) => validIndices[i])
      .map((d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }))

    rankChartRef.current = new Chart(rankCanvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: makeDatasets(players, playerColors, dayData, validIndices, (e) => e.rank <= 10 ? e.rank : null),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#c9c0d8',
              font: { family: 'inherit' },
              filter: (item) => (item.datasetIndex ?? 0) < 5,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#c9c0d8' },
            grid: { color: '#2a2035' },
          },
          y: {
            reverse: true,
            min: 0.5,
            max: 10.5,
            ticks: {
              color: '#c9c0d8',
              callback: (v) => `#${v}`,
            },
            afterBuildTicks: (scale) => {
              scale.ticks = Array.from({ length: 10 }, (_, i) => ({ value: i + 1 }))
            },
            grid: { color: '#2a2035' },
            title: { display: true, text: 'Rank', color: '#c9c0d8' },
          },
        },
      },
    })

    return () => {
      rankChartRef.current?.destroy()
      rankChartRef.current = null
    }
  }, [dates, dayData])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Top 10 — Last 5 Days</h3>
      <div className="chart-canvas-wrapper chart-canvas-wrapper--tall">
        <canvas ref={rankCanvasRef} />
      </div>
    </div>
  )
}
