import { useEffect, useRef, useState } from 'react'
import type { LeaderboardData } from './App'
import { parseDetails } from './App'
import type { LeaderboardFetchState } from './useLeaderboard'

const MIN_DATE = '2018-12-20'

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
  const [minDateError, setMinDateError] = useState(false)
  const [todayModal, setTodayModal] = useState(false)
  const [futureModal, setFutureModal] = useState(false)

  function dismissMinDateError() {
    setMinDateError(false)
    setDate(MIN_DATE)
    fetchDate(MIN_DATE)
  }

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
    if (newDate > todayDate()) { setFutureModal(true); return }
    if (newDate < MIN_DATE) { setMinDateError(true); return }
    if (newDate === todayDate()) { setTodayModal(true); return }
    setDate(newDate)
    fetchDate(newDate)
  }

  function stepDate(delta: number) {
    const [y, m, d] = date.split('-').map(Number)
    const newDate = new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10)
    if (newDate > todayDate()) { setFutureModal(true); return }
    if (newDate < MIN_DATE) { setMinDateError(true); return }
    if (newDate === todayDate()) { setTodayModal(true); return }
    setDate(newDate)
    fetchDate(newDate)
  }

  return (
    <div className="panel panel-leaderboard">
      {minDateError && (
        <div className="modal-backdrop" onClick={dismissMinDateError}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Date Out of Range</h2>
            <p>
              Modern leaderboards started on <strong>{MIN_DATE}</strong>, please select a valid date.
            </p>
            <button onClick={dismissMinDateError}>Dismiss</button>
          </div>
        </div>
      )}

      {todayModal && (
        <div className="modal-backdrop" onClick={() => setTodayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Today's Data Not Yet Available</h2>
            <p>Leaderboard data is archived at GMT 00:05 the following day.</p>
            <button onClick={() => setTodayModal(false)}>Dismiss</button>
          </div>
        </div>
      )}

      {futureModal && (
        <div className="modal-backdrop" onClick={() => setFutureModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Date Out of Range</h2>
            <p>Please select a date in the past.</p>
            <button onClick={() => setFutureModal(false)}>Dismiss</button>
          </div>
        </div>
      )}

      {notCached && (
        <div className="modal-backdrop" onClick={dismissNotCached}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Data Not Found</h2>
            <p>
              The leaderboard data for <strong>{date}</strong> could not be found.
            </p>
            <button onClick={dismissNotCached}>Dismiss</button>
          </div>
        </div>
      )}

      {error && <p className="status error">Error: {error}</p>}

      <div className="controls">
        <button onClick={() => stepDate(-1)}>&larr;</button>
        <input type="date" value={date} min={MIN_DATE} max={todayDate()} onChange={handleDateChange} />
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
              {displayData.entries.map((entry, i) => {
                const { missions, expenses, style, timeStr } = parseDetails(entry.details)
                return (
                  <tr key={`${i}-${date}`}>
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
