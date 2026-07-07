import { categoryById } from '../categories'
import { ACTIVITY_END_HOUR, ACTIVITY_START_HOUR } from '../config'
import { formatHours, formatKey, freeSlots, minToTime, timeRangeLabel } from '../utils'

// 日付をクリックしたときに出る「その日の予定一覧」モーダル。
// ここから予定を何個でも追加でき、予定をクリックすると編集できる。
export default function DayModal({
  dateKey,
  events,
  goals,
  favorites,
  onApplyFavorite,
  onDeleteFavorite,
  onAddEvent,
  onSelectEvent,
  onClose,
}) {
  const dayEvents = events
    .filter((e) => e.date === dateKey)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  const dayGoals = goals.filter((g) => g.deadline === dateKey && !g.done)
  const daySteps = goals
    .filter((g) => !g.done)
    .flatMap((g) =>
      (g.steps ?? [])
        .filter((s) => !s.done && s.deadline === dateKey)
        .map((s) => ({ ...s, goalTitle: g.title })),
    )
  const slots = freeSlots(dayEvents)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{formatKey(dateKey)} の予定</h2>
        {dayGoals.map((g) => (
          <div key={g.id} className="day-goal">
            🎯 {g.title}（この日まで）
          </div>
        ))}
        {daySteps.map((s) => (
          <div key={s.id} className="day-step">
            ⚐ {s.title}（「{s.goalTitle}」のステップ・この日まで）
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
        {favorites.length > 0 && (
          <div className="favorite-section">
            <h3>⭐ よく使う予定（タップでこの日に追加）</h3>
            <div className="favorite-chips">
              {favorites.map((fav) => {
                const cat = categoryById(fav.category)
                const timeLabel = timeRangeLabel(fav)
                return (
                  <span key={fav.id} className="favorite-chip" style={{ borderColor: cat.color }}>
                    <button
                      type="button"
                      className="favorite-apply"
                      style={{ color: cat.color }}
                      onClick={() => onApplyFavorite(fav)}
                      title="タップでこの日に追加"
                    >
                      {fav.title}
                      {timeLabel && <span className="favorite-time">{timeLabel}</span>}
                    </button>
                    <button
                      type="button"
                      className="favorite-del"
                      onClick={() => onDeleteFavorite(fav.id)}
                      aria-label="よく使う予定から削除"
                    >
                      ✕
                    </button>
                  </span>
                )
              })}
            </div>
          </div>
        )}
        <div className="free-section">
          <h3>
            🕐 空き時間（{ACTIVITY_START_HOUR}:00〜{ACTIVITY_END_HOUR}:00）
          </h3>
          {slots.length === 0 ? (
            <p className="day-empty">空き時間はありません</p>
          ) : (
            <div className="free-slot-list">
              {slots.map(([s, t]) => (
                <span key={s} className="free-slot">
                  {minToTime(s)}〜{minToTime(t)}（{formatHours((t - s) / 60)}）
                </span>
              ))}
            </div>
          )}
        </div>
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
