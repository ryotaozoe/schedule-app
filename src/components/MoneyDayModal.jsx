import { formatYen } from '../money'
import { formatKey } from '../utils'

// お金カレンダーで日付をクリックしたときの、その日の収入・支出一覧。
export default function MoneyDayModal({ dateKey, entries, onAdd, onSelectEntry, onClose }) {
  const dayEntries = entries
    .filter((e) => e.date === dateKey)
    .sort((a, b) => (a.type === b.type ? 0 : a.type === 'income' ? -1 : 1))
  const income = dayEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = dayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{formatKey(dateKey)} のお金</h2>
        {dayEntries.length === 0 && <p className="day-empty">まだ記録がありません</p>}
        {dayEntries.length > 0 && (
          <>
            <div className="money-day-summary">
              <span className="money-in">収入 {formatYen(income)}</span>
              <span className="money-out">支出 {formatYen(expense)}</span>
            </div>
            <ul className="day-event-list">
              {dayEntries.map((en) => (
                <li key={en.id}>
                  <button
                    className="day-event"
                    style={{ borderLeftColor: en.type === 'income' ? '#46c98a' : '#f2777a' }}
                    onClick={() => onSelectEntry(en)}
                    title="クリックで編集"
                  >
                    <span
                      className="day-event-title"
                      style={{ color: en.type === 'income' ? '#46c98a' : '#f2777a' }}
                    >
                      {en.name}
                    </span>
                    <span className="money-day-amount">
                      {en.type === 'income' ? '+' : '-'}
                      {formatYen(en.amount)}
                    </span>
                    {en.memo && <span className="day-event-memo">{en.memo}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            閉じる
          </button>
          <span className="spacer" />
          <button type="button" className="money-add-in" onClick={() => onAdd('income')}>
            ＋ 収入
          </button>
          <button type="button" className="money-add-out" onClick={() => onAdd('expense')}>
            ＋ 支出
          </button>
        </div>
      </div>
    </div>
  )
}
