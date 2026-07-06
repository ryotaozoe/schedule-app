import { categoryById } from '../categories'
import { formatKey, timeRangeLabel } from '../utils'

// 日付をクリックしたときに出る「その日の予定一覧」モーダル。
// ここから予定を何個でも追加でき、予定をクリックすると編集できる。
export default function DayModal({ dateKey, events, goals, onAddEvent, onSelectEvent, onClose }) {
  const dayEvents = events
    .filter((e) => e.date === dateKey)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  const dayGoals = goals.filter((g) => g.deadline === dateKey && !g.done)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{formatKey(dateKey)} の予定</h2>
        {dayGoals.map((g) => (
          <div key={g.id} className="day-goal">
            🎯 {g.title}（この日まで）
          </div>
        ))}
        {dayEvents.length === 0 && <p className="day-empty">まだ予定がありません</p>}
        <ul className="day-event-list">
          {dayEvents.map((ev) => {
            const cat = categoryById(ev.category)
            const timeLabel = timeRangeLabel(ev)
            return (
              <li key={ev.id}>
                <button
                  className="day-event"
                  style={{ borderLeftColor: cat.color }}
                  onClick={() => onSelectEvent(ev)}
                  title="クリックで編集"
                >
                  {timeLabel && <span className="day-event-time">{timeLabel}</span>}
                  <span className="day-event-title" style={{ color: cat.color }}>
                    {ev.title}
                  </span>
                  <span
                    className="day-event-cat"
                    style={{ background: `${cat.color}1a`, color: cat.color }}
                  >
                    {cat.label}
                  </span>
                  {ev.memo && <span className="day-event-memo">{ev.memo}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            閉じる
          </button>
          <span className="spacer" />
          <button type="button" className="primary" onClick={onAddEvent}>
            ＋ 予定を追加
          </button>
        </div>
      </div>
    </div>
  )
}
