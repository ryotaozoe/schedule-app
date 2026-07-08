import { formatYen } from '../money'
import { toKey, todayKey } from '../utils'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// お金の予定（収入・支出）を表示するカレンダー。
export default function MoneyCalendar({ year, month, entries, onSelectDate }) {
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
          const dayEntries = entries
            .filter((e) => e.date === key)
            .sort((a, b) => (a.type === b.type ? 0 : a.type === 'income' ? -1 : 1))
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
              {dayEntries.map((en) => (
                <div key={en.id} className={`money-chip ${en.type}`} title={`${en.name} ${formatYen(en.amount)}`}>
                  <span className="money-chip-name">{en.name}</span>
                  <span className="money-chip-amount">
                    {en.type === 'income' ? '+' : '-'}
                    {formatYen(en.amount)}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div className="legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#46c98a' }} />
          収入
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#f2777a' }} />
          支出
        </span>
      </div>
    </div>
  )
}
