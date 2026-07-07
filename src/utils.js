import { ACTIVITY_END_HOUR, ACTIVITY_START_HOUR, DEFAULT_EVENT_HOURS } from './config'

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

// 今月を表す 'YYYY-MM'（AI利用量の月別集計に使う）
export function monthKey() {
  return toKey(new Date()).slice(0, 7)
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

// '18:30' → 1110（0時からの分数）
export function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// 1110 → '18:30'
export function minToTime(min) {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`
}

// 11.5 → '11.5h'
export function formatHours(h) {
  return `${Math.round(h * 10) / 10}h`
}

// 予定の所要時間（時間単位）。
// 時間未設定や終了時間なしの予定は DEFAULT_EVENT_HOURS とみなす。
export function eventDurationHours(ev) {
  if (ev.time && ev.endTime) {
    const d = (timeToMin(ev.endTime) - timeToMin(ev.time)) / 60
    if (d > 0) return d
  }
  return DEFAULT_EVENT_HOURS
}

// その日の予定一覧から、活動時間内で予定が入っていない区間を求める。
// 戻り値は [開始分, 終了分] の配列。開始のみの予定は DEFAULT_EVENT_HOURS ぶん埋まる扱い。
// 時間未設定の予定は場所が決められないため空き時間の計算には含めない。
export function freeSlots(dayEvents) {
  const start = ACTIVITY_START_HOUR * 60
  const end = ACTIVITY_END_HOUR * 60
  const blocks = dayEvents
    .filter((e) => e.time)
    .map((e) => {
      const s = timeToMin(e.time)
      const hasEnd = e.endTime && timeToMin(e.endTime) > s
      const t = hasEnd ? timeToMin(e.endTime) : s + DEFAULT_EVENT_HOURS * 60
      return [Math.max(s, start), Math.min(t, end)]
    })
    .filter(([s, t]) => t > s)
    .sort((a, b) => a[0] - b[0])

  const slots = []
  let cursor = start
  for (const [s, t] of blocks) {
    if (s > cursor) slots.push([cursor, s])
    cursor = Math.max(cursor, t)
  }
  if (cursor < end) slots.push([cursor, end])
  return slots
}

// 空き時間の合計（時間単位）
export function freeHours(dayEvents) {
  return freeSlots(dayEvents).reduce((sum, [s, t]) => sum + (t - s), 0) / 60
}
