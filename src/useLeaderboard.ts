import { useEffect, useState } from 'react'
import type { LeaderboardData } from './App'

const REMOTE_URL = (d: string) =>
  `https://raw.githubusercontent.com/piepieonline/heat-signature-leaderboard-history/refs/heads/main/${d}.json`

export const isRemote = !(import.meta.env.DEV && !import.meta.env.VITE_USE_REMOTE)

export function fetchUrl(d: string) {
  return isRemote ? REMOTE_URL(d) : `/leaderboard?date=${d}`
}

function yesterdayDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function fetchLeaderboardJson(d: string): Promise<LeaderboardData | null> {
  const res = await fetch(fetchUrl(d))
  if (!res.ok) return null
  return res.json() as Promise<LeaderboardData>
}

export interface LeaderboardFetchState {
  data: LeaderboardData | null
  fetchLoading: boolean
  error: string | null
  notCached: boolean
  dismissNotCached: () => void
  fetchDate: (date: string) => void
  loadDate: (date: string) => void
}

export function useLeaderboard(chartDates: string[]) {
  const [chartDayData, setChartDayData] = useState<(LeaderboardData | null)[]>(() =>
    Array(chartDates.length).fill(null)
  )
  const [initialData, setInitialData] = useState<LeaderboardData | null>(null)
  const [chartLoading, setChartLoading] = useState(true)

  const [selectedData, setSelectedData] = useState<LeaderboardData | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notCached, setNotCached] = useState(false)

  // Load initial chart data for all chart dates
  useEffect(() => {
    Promise.allSettled(chartDates.map((d) => fetchLeaderboardJson(d).catch(() => null))).then(
      (results) => {
        const loaded = results.map((r) => (r.status === 'fulfilled' ? r.value : null))
        setChartDayData(loaded)
        const yIdx = chartDates.indexOf(yesterdayDate())
        if (yIdx !== -1 && loaded[yIdx]) setInitialData(loaded[yIdx])
        setChartLoading(false)
      }
    )
  }, [])

  async function doFetch(d: string) {
    const chartIdx = chartDates.indexOf(d)
    if (chartIdx !== -1 && chartDayData[chartIdx] !== null) {
      setSelectedData(chartDayData[chartIdx])
      setError(null)
      return
    }

    setFetchLoading(true)
    setError(null)
    setNotCached(false)

    try {
      const res = await fetch(fetchUrl(d))
      if (res.status === 404 && isRemote) {
        setNotCached(true)
        return
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const json = (await res.json()) as LeaderboardData
      setSelectedData(json)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setFetchLoading(false)
    }
  }

  const fetchState: LeaderboardFetchState = {
    data: selectedData,
    fetchLoading,
    error,
    notCached,
    dismissNotCached: () => setNotCached(false),
    fetchDate: doFetch,
    loadDate: doFetch,
  }

  return {
    chartDayData,
    initialData,
    chartLoading,
    fetchState,
  }
}
