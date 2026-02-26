import { useEffect, useRef, useState } from 'react'
import type { LeaderboardData } from './App'
import { parseDetails } from './App'
import type { LeaderboardFetchState } from './useLeaderboard'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

function initialDate() {
  const param = new URLSearchParams(window.location.search).get('date')
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param) && param <= todayDate()) return param
  return yesterdayDate()
}


interface Props {
  chartDates: string[]
  chartDayData: (LeaderboardData | null)[]
  initialData: LeaderboardData | null
  loading: boolean
  fetchState: LeaderboardFetchState
}

export default function Leaderboard({ initialData, loading: initialLoading, fetchState }: Props) {
  const [date, setDate] = useState(initialDate)
  const lastWorkingDate = useRef(initialDate())

  const { data, fetchLoading, error, notCached, dismissNotCached, fetchDate, loadDate } = fetchState

  useEffect(() => {
    if (data != null) lastWorkingDate.current = date
  }, [data])

  useEffect(() => {
    if (error || notCached) setDate(lastWorkingDate.current)
  }, [error, notCached])

  const displayData = data ?? initialData
  const isLoading = initialLoading || fetchLoading

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    if (newDate > todayDate()) return
    setDate(newDate)
    fetchDate(newDate)
  }

  function stepDate(delta: number) {
    const [y, m, d] = date.split('-').map(Number)
    const newDate = new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
    if (newDate > todayDate()) return
    setDate(newDate)
    fetchDate(newDate)
  }

  return (
    <div className="panel panel-leaderboard">
      {notCached && (
        <div className="modal-backdrop" onClick={dismissNotCached}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Data Not Available</h2>
            <p>
              The leaderboard data for <strong>{date}</strong> hasn't been cached yet and isn't
              available in the remote history.
            </p>
            <p>Data is archived daily — older or future dates may not be stored.</p>
            <button onClick={dismissNotCached}>Dismiss</button>
          </div>
        </div>
      )}

      {error && <p className="status error">Error: {error}</p>}

      <div className="controls">
        <button onClick={() => stepDate(-1)}>&larr;</button>
        <input type="date" value={date} max={todayDate()} onChange={handleDateChange} />
        <button onClick={() => stepDate(1)}>&rarr;</button>
        <button onClick={() => loadDate(date)} disabled={isLoading}>
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
              {displayData.entries.map((entry) => {
                const { missions, expenses, style, timeStr } = parseDetails(entry.details)
                return (
                  <tr key={`${entry.steamId}-${date}`}>
                    <td className="rank">{entry.rank}</td>
                    <td className="name">{entry.name}</td>
                    <td>{missions}/3</td>
                    <td>{expenses}</td>
                    <td>{style > 0 ? `+${style}` : style}</td>
                    <td>{timeStr}</td>
                    <td className="score">{entry.displayScore}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {displayData.entries.length === 0 && <p className="status">No entries found.</p>}
        </>
      )}
    </div>
  )
}
