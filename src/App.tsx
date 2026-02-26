import { useState } from 'react'
import './App.css'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, BarController, BarElement } from 'chart.js'
import TopPlayersChart from './TopPlayersChart'
import MissionsChart from './MissionsChart'
import ScoreHistogram from './ScoreHistogram'
import Leaderboard from './Leaderboard'
import { useLeaderboard } from './useLeaderboard'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, BarController, BarElement)

export interface LeaderboardEntry {
  rank: number
  displayScore: number
  details: string  // "missions:expenses:style:timeSecs"
  steamId: number
  name: string
}

export function parseDetails(details: string) {
  const parts = details.split(':')
  const missions = Number(parts[0])
  const expenses = Number(parts[1])
  const style = Number(parts[2])
  const timeSecs = Number(parts[3])
  const totalSecs = Math.round(timeSecs)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  const timeStr = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
  return { missions, expenses, style, timeSecs, timeStr }
}

export interface LeaderboardData {
  date: string
  leaderboard: string
  count: number
  entries: LeaderboardEntry[]
}

export function lastNDatesEndingYesterday(n: number): string[] {
  const dates: string[] = []
  for (let i = n; i >= 1; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function App() {
  const [chartDates] = useState<string[]>(() => lastNDatesEndingYesterday(5))
  const { chartDayData, initialData, chartLoading, fetchState } = useLeaderboard(chartDates)
  const displayData = fetchState.data ?? initialData

  return (
    <div className="container">
      <h1>Heat Signature Daily Leaderboard and Stats</h1>
      <br />
      <br />

      <div className="panels">
        <Leaderboard
          chartDates={chartDates}
          chartDayData={chartDayData}
          initialData={initialData}
          loading={chartLoading}
          fetchState={fetchState}
        />
        <div className="panel panel-stats">
          <div className="charts-stack">
            <TopPlayersChart dates={chartDates} dayData={chartDayData} />
            <MissionsChart data={displayData} />
            <ScoreHistogram data={displayData} />
          </div>
        </div>
      </div>
      <footer className="footer">
        <a href="https://github.com/piepieonline/heat-signature-leaderboard" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  )
}

export default App
