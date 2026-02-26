import { useRef, useState } from 'react'
import { fetchUrl } from './App'
import type { LeaderboardData } from './App'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}


function parseDetails(details: string) {
  const parts = details.split(':')
  return {
    expenses: Number(parts[1]),
    style: Number(parts[2]),
  }
}

interface Props {
  chartDates: string[]
  chartDayData: (LeaderboardData | null)[]
  initialData: LeaderboardData | null
  loading: boolean
}

export default function Leaderboard({ chartDates, chartDayData, initialData, loading: initialLoading }: Props) {
  const [date, setDate] = useState(yesterdayDate)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LeaderboardData | null>(null)
  const hasFetchedOnce = useRef(true)

  const displayData = data ?? initialData
  const isLoading = initialLoading || fetchLoading

  function fetchLeaderboard(d: string) {
    const chartIdx = chartDates.indexOf(d)
    if (chartIdx !== -1 && chartDayData[chartIdx] !== null) {
      setData(chartDayData[chartIdx])
      setError(null)
      return
    }
    setFetchLoading(true)
    setError(null)
    fetch(fetchUrl(d))
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((json: LeaderboardData) => {
        setData(json)
        setFetchLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setFetchLoading(false)
      })
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    if (newDate > todayDate()) return
    setDate(newDate)
    if (hasFetchedOnce.current) fetchLeaderboard(newDate)
  }

  function stepDate(delta: number) {
    const [y, m, d] = date.split('-').map(Number)
    const newDate = new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
    if (newDate > todayDate()) return
    setDate(newDate)
    if (hasFetchedOnce.current) fetchLeaderboard(newDate)
  }

  function handleFetch() {
    hasFetchedOnce.current = true
    fetchLeaderboard(date)
  }

  return (
    <div className="panel panel-leaderboard">
      {error && <p className="status error">Error: {error}</p>}

      <div className="controls">
        <button onClick={() => stepDate(-1)}>&larr;</button>
        <input type="date" value={date} max={todayDate()} onChange={handleDateChange} />
        <button onClick={() => stepDate(1)}>&rarr;</button>
        <button onClick={handleFetch} disabled={isLoading}>
          {isLoading ? 'Loading…' : 'Load'}
        </button>
      </div>

      {displayData && (
        <>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th className="col-name">Name</th>
                <th>Missions</th>
                <th>Expenses</th>
                <th>Style</th>
                <th>Time</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {displayData.entries.map((entry, index) => {
                const { expenses, style } = parseDetails(entry.details)
                return (
                  <tr key={index}>
                    <td className="rank">{entry.rank}</td>
                    <td className="name">{entry.name}</td>
                    <td>{entry.missions}/3</td>
                    <td>{expenses}</td>
                    <td>{style > 0 ? `+${style}` : style}</td>
                    <td>{entry.timeStr}</td>
                    <td className="score">{entry.displayScore}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayData.entries.length === 0 && (
            <p className="status">No entries found.</p>
          )}
        </>
      )}
    </div>
  )
}
