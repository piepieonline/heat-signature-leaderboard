import { useRef, useState } from 'react'
import './App.css'

interface LeaderboardEntry {
  rank: number
  missions: number
  displayScore: number
  timeSecs: number
  timeStr: string
  details: string  // "missions:expenses:style:timeSecs"
  steamId: number
  name: string
}

interface LeaderboardData {
  date: string
  leaderboard: string
  count: number
  entries: LeaderboardEntry[]
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function parseDetails(details: string) {
  const parts = details.split(':')
  return {
    expenses: Number(parts[1]),
    style: Number(parts[2]),
  }
}

function App() {
  const [date, setDate] = useState(todayDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LeaderboardData | null>(null)
  const hasFetchedOnce = useRef(false)

  function fetchLeaderboard(d: string) {
    setLoading(true)
    setError(null)
    fetch(`/leaderboard?date=${d}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((json: LeaderboardData) => {
        setData(json)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    if (newDate > todayDate()) return
    setDate(newDate)
    if (hasFetchedOnce.current) {
      fetchLeaderboard(newDate)
    }
  }

  function stepDate(delta: number) {
    const [y, m, d] = date.split('-').map(Number)
    const newDate = new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
    if (newDate > todayDate()) return
    setDate(newDate)
    if (hasFetchedOnce.current) {
      fetchLeaderboard(newDate)
    }
  }

  function handleFetch() {
    hasFetchedOnce.current = true
    fetchLeaderboard(date)
  }

  return (
    <div className="container">
      <h1>Heat Signature</h1>
      <h2>Daily Leaderboard</h2>

      <div className="controls">
        <button onClick={() => stepDate(-1)}>&larr;</button>
        <input type="date" value={date} max={todayDate()} onChange={handleDateChange} />
        <button onClick={() => stepDate(1)}>&rarr;</button>
        <button onClick={handleFetch} disabled={loading}>
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>

      {error && <p className="status error">Error: {error}</p>}

      {data && (
        <>
          <p className="leaderboard-name">{data.leaderboard} &mdash; {data.count} entries</p>
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
              {data.entries.map((entry) => {
                const { expenses, style } = parseDetails(entry.details)
                return (
                  <tr key={entry.rank}>
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
          {data.entries.length === 0 && (
            <p className="status">No entries found.</p>
          )}
        </>
      )}
    </div>
  )
}

export default App
