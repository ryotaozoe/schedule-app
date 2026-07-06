// 日付を 'YYYY-MM-DD' 形式の文字列にする（ローカルタイムゾーン基準）
export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return toKey(new Date())
}

// 今日から指定日までの残り日数（過ぎていればマイナス）
export function daysUntil(key) {
  const [y, m, d] = key.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86400000)
}

// '2026-07-06' → '7月6日(月)'
export function formatKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const w = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${m}月${d}日(${w})`
}

// 予定の時間帯を「18:00〜21:00」のような表示用文字列にする
export function timeRangeLabel(ev) {
  if (ev.time && ev.endTime) return `${ev.time}〜${ev.endTime}`
  if (ev.time) return ev.time
  if (ev.endTime) return `〜${ev.endTime}`
  return ''
}

export function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
