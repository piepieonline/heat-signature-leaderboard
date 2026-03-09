import { useState, useEffect, useMemo } from 'react'
import { isRemote } from './useLeaderboard'

interface PlayerStat {
  steamId: number
  name: string
  appearances: number
  bestRank: number
  bestRankDate: string
  medianRank: number
  medianRankLast30: number | null
  bestRankLast30: number | null
  bestRankLast30Date: string | null
}

interface StatsData {
  lastUpdated: string
  players: PlayerStat[]
}

type SortKey = 'name' | 'appearances' | 'bestRank' | 'bestRankDate' | 'medianRank' | 'medianRankLast30' | 'bestRankLast30' | 'bestRankLast30Date'
type SortDir = 'asc' | 'desc'

interface ColDef {
  key: SortKey
  label: string
  defaultVisible: boolean
  className?: string
  render: (p: PlayerStat) => React.ReactNode
}

const COLUMNS: ColDef[] = [
  { key: 'name',             label: 'Name',            defaultVisible: true,  className: 'col-name', render: p => p.name },
  { key: 'appearances',      label: 'Appearances',     defaultVisible: true,  render: p => p.appearances },
  { key: 'bestRank',         label: 'Best Rank',       defaultVisible: true,  className: 'rank', render: p => `#${p.bestRank}` },
  { key: 'bestRankDate',     label: 'Best Rank Date',  defaultVisible: false, render: p => p.bestRankDate },
  { key: 'bestRankLast30',   label: 'Best (30d)',      defaultVisible: true,  className: 'rank', render: p => p.bestRankLast30 != null ? `#${p.bestRankLast30}` : '—' },
  { key: 'bestRankLast30Date', label: 'Best (30d) Date', defaultVisible: false, render: p => p.bestRankLast30Date ?? '—' },
  { key: 'medianRank',       label: 'Median Rank',     defaultVisible: true,  className: 'rank', render: p => `#${p.medianRank}` },
  { key: 'medianRankLast30', label: 'Median (30d)',    defaultVisible: true,  className: 'rank', render: p => p.medianRankLast30 != null ? `#${p.medianRankLast30}` : '—' },
]

const DEFAULT_VISIBLE = new Set(COLUMNS.filter(c => c.defaultVisible).map(c => c.key))

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
  const [visibleCols, setVisibleCols] = useState<Set<SortKey>>(() => {
    try {
      const saved = localStorage.getItem('stats-visible-cols')
      if (saved) {
        const parsed = JSON.parse(saved) as SortKey[]
        if (Array.isArray(parsed) && parsed.length > 0) return new Set(parsed)
      }
    } catch { /* ignore */ }
    return DEFAULT_VISIBLE
  })
  const [colPickerOpen, setColPickerOpen] = useState(false)

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
      setSortDir(key === 'appearances' ? 'desc' : 'asc')
    }
  }

  function toggleCol(key: SortKey) {
    setVisibleCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      localStorage.setItem('stats-visible-cols', JSON.stringify([...next]))
      return next
    })
  }

  const activeCols = COLUMNS.filter(c => visibleCols.has(c.key))

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
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="stats-search"
        />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setColPickerOpen(o => !o)} className="stats-col-btn">
            Columns ▾
          </button>
          {colPickerOpen && (
            <div className="stats-col-picker">
              {COLUMNS.map(col => (
                <label key={col.key} className="stats-col-picker-item">
                  <input
                    type="checkbox"
                    checked={visibleCols.has(col.key)}
                    onChange={() => toggleCol(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {activeCols.map(col => (
              <th
                key={col.key}
                className={['stats-th-sortable', col.key === 'name' ? 'col-name' : ''].filter(Boolean).join(' ')}
                onClick={() => handleSort(col.key)}
              >
                {col.label}<SortIndicator active={sortKey === col.key} dir={sortDir} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={activeCols.length} className="status">No players found.</td></tr>
          )}
          {rows.map(p => (
            <tr key={String(p.steamId)}>
              {activeCols.map(col => (
                <td key={col.key} className={col.className}>{col.render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
