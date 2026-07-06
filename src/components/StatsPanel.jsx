import { useState } from 'react'
import { CATEGORIES, categoryById } from '../categories'
import { eventDurationHours, formatHours, toKey } from '../utils'

// カテゴリ別に予定の時間を集計して円グラフで見せるパネル。
// 「どのカテゴリに時間を使っているか」を今週／今月で振り返れる。
export default function StatsPanel({ events }) {
  const [range, setRange] = useState('week') // 'week' | 'month'

  const now = new Date()
  let from
  let to
  if (range === 'week') {
    const sun = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    from = toKey(sun)
    to = toKey(new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() + 6))
  } else {
    from = toKey(new Date(now.getFullYear(), now.getMonth(), 1))
    to = toKey(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  }

  const byCat = new Map()
  for (const ev of events) {
    if (ev.date < from || ev.date > to) continue
    const cat = categoryById(ev.category)
    byCat.set(cat.id, (byCat.get(cat.id) ?? 0) + eventDurationHours(ev))
  }
  const totals = CATEGORIES.filter((c) => byCat.has(c.id))
    .map((c) => ({ ...c, hours: byCat.get(c.id) }))
    .sort((a, b) => b.hours - a.hours)
  const total = totals.reduce((sum, t) => sum + t.hours, 0)

  // カテゴリごとの割合をconic-gradientの角度に変換して円グラフにする
  let acc = 0
  const stops = totals.map((t) => {
    const start = (acc / total) * 360
    acc += t.hours
    return `${t.color} ${start}deg ${(acc / total) * 360}deg`
  })

  const shortDate = (key) => {
    const [, m, d] = key.split('-').map(Number)
    return `${m}/${d}`
  }

  return (
    <aside className="stats-panel">
      <div className="stats-head">
        <h2>📊 時間の使いみち</h2>
        <div className="range-toggle">
          <button className={range === 'week' ? 'active' : ''} onClick={() => setRange('week')}>
            今週
          </button>
          <button className={range === 'month' ? 'active' : ''} onClick={() => setRange('month')}>
            今月
          </button>
        </div>
      </div>
      <p className="stats-period">
        {shortDate(from)}〜{shortDate(to)}・合計 {formatHours(total)}
      </p>
      {total === 0 ? (
        <p className="stats-empty">この期間の予定はまだありません</p>
      ) : (
        <div className="stats-body">
          <div className="pie" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
          <ul className="stats-list">
            {totals.map((t) => (
              <li key={t.id}>
                <span className="legend-dot" style={{ background: t.color }} />
                <span className="stats-label">{t.label}</span>
                <span className="stats-hours">
                  {formatHours(t.hours)}
                  <small>（{Math.round((t.hours / total) * 100)}%）</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="stats-note">※時間未設定の予定は2時間として集計しています</p>
    </aside>
  )
}
