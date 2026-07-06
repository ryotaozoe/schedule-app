import { CATEGORIES, categoryById } from '../categories'
import { timeRangeLabel, toKey, todayKey } from '../utils'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function Calendar({ year, month, events, goals, onSelectDate, onSelectEvent }) {
  // 月初の週の日曜日から6週間分（42マス）を並べる
  const firstDay = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstDay.getDay())
  const cells = []
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  const today = todayKey()

  return (
    <div className="calendar">
      <div className="calendar-grid">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
            {w}
          </div>
        ))}
        {cells.map((date) => {
          const key = toKey(date)
          const dayEvents = events
            .filter((e) => e.date === key)
            .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
          const dayGoals = goals.filter((g) => g.deadline === key && !g.done)
          const dow = date.getDay()
          const classes = [
            'day-cell',
            date.getMonth() !== month ? 'other-month' : '',
            key === today ? 'today' : '',
          ].join(' ')

          return (
            <div key={key} className={classes} onClick={() => onSelectDate(key)}>
              <div className={`day-number ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}`}>
                {date.getDate()}
              </div>
              {dayGoals.map((g) => (
                <div key={g.id} className="goal-chip" title={`目標: ${g.title}`}>
                  🎯 {g.title}
                </div>
              ))}
              {dayEvents.map((ev) => {
                const cat = categoryById(ev.category)
                const timeLabel = timeRangeLabel(ev)
                return (
                  <button
                    key={ev.id}
                    className="event-chip"
                    style={{
                      color: cat.color,
                      borderLeftColor: cat.color,
                      background: `${cat.color}14`,
                    }}
                    title={ev.memo || ev.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectEvent(ev)
                    }}
                  >
                    {timeLabel && <span className="event-time">{timeLabel}</span>}
                    {ev.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="legend">
        {CATEGORIES.map((c) => (
          <span key={c.id} className="legend-item">
            <span className="legend-dot" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
