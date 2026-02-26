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
  missions: number
  displayScore: number
  timeSecs: number
  timeStr: string
  details: string  // "missions:expenses:style:timeSecs"
  steamId: number
  name: string
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
