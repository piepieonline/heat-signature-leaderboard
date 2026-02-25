import { useEffect, useRef } from 'react'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip)

interface LeaderboardEntry {
  rank: number
  displayScore: number
  steamId: number
  name: string
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
}

const COLORS = [
  '#e8c96a', '#7ec8e3', '#b57bee', '#e87a5a', '#7be87a',
  '#e8a06a', '#6ab4e8', '#e86ab5', '#a0e86a', '#e86a6a',
]

function lastNDates(n: number): string[] {
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function makeDatasets(
  players: LeaderboardEntry[],
  colors: string[],
  dayData: (LeaderboardData | null)[],
  validIndices: boolean[],
  getValue: (entry: LeaderboardEntry) => number | null,
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
    spanGaps: false,
    tension: 0.3,
    pointRadius: 4,
  }
  })
}

export default function TopPlayersChart() {
  const rankCanvasRef = useRef<HTMLCanvasElement>(null)
  const rankChartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const dates = lastNDates(5)
    let cancelled = false

    Promise.allSettled(
      dates.map((date) =>
        fetch(import.meta.env.DEV ? `/leaderboard?date=${date}` : `/leaderboards/${date}.json`)
          .then((res) => (res.ok ? (res.json() as Promise<LeaderboardData>) : Promise.resolve(null)))
          .catch(() => null)
      )
    ).then((results) => {
      const dayData: (LeaderboardData | null)[] = results.map((r) =>
        r.status === 'fulfilled' ? r.value : null
      )

      // Collect all unique players who appeared in top 10 on any day, ordered by first appearance
      const seen = new Map<number, LeaderboardEntry>()
      for (const day of dayData) {
        if (!day) continue
        for (const entry of day.entries) {
          if (entry.rank <= 10 && !seen.has(entry.steamId)) {
            seen.set(entry.steamId, entry)
          }
        }
      }
      // Count how many days each player appeared in the top 10
      const appearances = new Map<number, number>()
      for (const day of dayData) {
        if (!day) continue
        for (const entry of day.entries) {
          if (entry.rank <= 10) {
            appearances.set(entry.steamId, (appearances.get(entry.steamId) ?? 0) + 1)
          }
        }
      }

      // Sort by appearance count descending so most-frequent players get distinct colors
      const players = Array.from(seen.values()).sort(
        (a, b) => (appearances.get(b.steamId) ?? 0) - (appearances.get(a.steamId) ?? 0)
      )

      if (cancelled || players.length === 0 || !rankCanvasRef.current) return

      // Assign palette colors only to players who appear on multiple days
      let colorIdx = 0
      const playerColors = players.map((p) =>
        (appearances.get(p.steamId) ?? 0) > 1 ? (COLORS[colorIdx++] ?? '#ffffff') : '#ffffff'
      )

      const validIndices = dates.map((_, i) => dayData[i] !== null)
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
                filter: (item) => item.datasetIndex < 5,
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
    })

    return () => {
      cancelled = true
      rankChartRef.current?.destroy()
      rankChartRef.current = null
    }
  }, [])

  return (
    <div className="chart-container">
      <h3 className="chart-title">Top 10 — Last 5 Days</h3>
      <div className="chart-canvas-wrapper chart-canvas-wrapper--tall">
        <canvas ref={rankCanvasRef} />
      </div>
    </div>
  )
}
