import { useEffect, useState } from 'react'
import './App.css'
import TopPlayersChart from './TopPlayersChart'
import Leaderboard from './Leaderboard'

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

function fetchUrl(d: string) {
  return import.meta.env.DEV
    ? `/leaderboard?date=${d}`
    : `${import.meta.env.BASE_URL}leaderboards/${d}.json`
}

function yesterdayDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function App() {
  const [chartDates] = useState<string[]>(() => lastNDatesEndingYesterday(5))
  const [chartDayData, setChartDayData] = useState<(LeaderboardData | null)[]>(() => Array(5).fill(null))
  const [initialData, setInitialData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled(
      chartDates.map((d) =>
        fetch(fetchUrl(d))
          .then((res) => (res.ok ? (res.json() as Promise<LeaderboardData>) : Promise.resolve(null)))
          .catch(() => null)
      )
    ).then((results) => {
      const loaded = results.map((r) => (r.status === 'fulfilled' ? r.value : null))
      setChartDayData(loaded)
      const yIdx = chartDates.indexOf(yesterdayDate())
      if (yIdx !== -1 && loaded[yIdx]) setInitialData(loaded[yIdx])
      setLoading(false)
    })
  }, [])

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
          loading={loading}
        />
        <div className="panel panel-stats">
          <TopPlayersChart dates={chartDates} dayData={chartDayData} />
        </div>
      </div>
    </div>
  )
}

export default App
