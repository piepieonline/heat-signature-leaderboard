import { useState, useEffect, useMemo } from 'react'
import { isRemote } from './useLeaderboard'

interface PlayerStat {
  steamId: number
  name: string
  appearances: number
  bestRank: number
  bestRankDate: string
}

interface StatsData {
  lastUpdated: string
  players: PlayerStat[]
}

type SortKey = 'name' | 'appearances' | 'bestRank' | 'bestRankDate'
type SortDir = 'asc' | 'desc'

const STATS_URL = isRemote
  ? 'https://raw.githubusercontent.com/piepieonline/heat-signature-leaderboard-history/refs/heads/main/stats.json'
  : '/stats'

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span style={{ opacity: 0.3 }}> ↕</span>
  return <span> {dir === 'asc' ? '↑' : '↓'}</span>
}

export default function PlayerStats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('bestRank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    fetch(STATS_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: StatsData) => setData(d))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'bestRankDate' ? 'asc' : key === 'bestRank' ? 'asc' : 'desc')
    }
  }

  const rows = useMemo(() => {
    if (!data) return []
    let filtered = data.players
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [data, search, sortKey, sortDir])

  if (loading) return <p className="status">Loading stats…</p>
  if (error) return <p className="status error">Error loading stats: {error}</p>
  if (!data) return null

  return (
    <div>
      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Last updated: {data.lastUpdated} · {data.players.length} players tracked
      </p>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="stats-search"
        />
      </div>
      <table>
        <thead>
          <tr>
            <th className="col-name stats-th-sortable" onClick={() => handleSort('name')}>
              Name<SortIndicator active={sortKey === 'name'} dir={sortDir} />
            </th>
            <th className="stats-th-sortable" onClick={() => handleSort('appearances')}>
              Appearances<SortIndicator active={sortKey === 'appearances'} dir={sortDir} />
            </th>
            <th className="stats-th-sortable" onClick={() => handleSort('bestRank')}>
              Best Rank<SortIndicator active={sortKey === 'bestRank'} dir={sortDir} />
            </th>
            <th className="stats-th-sortable" onClick={() => handleSort('bestRankDate')}>
              Best Rank Date<SortIndicator active={sortKey === 'bestRankDate'} dir={sortDir} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="status">No players found.</td></tr>
          )}
          {rows.map(p => (
            <tr key={String(p.steamId)}>
              <td className="name">{p.name}</td>
              <td>{p.appearances}</td>
              <td className="rank">#{p.bestRank}</td>
              <td>{p.bestRankDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
