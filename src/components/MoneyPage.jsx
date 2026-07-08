import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { formatYen, monthOf } from '../money'
import { uid } from '../utils'
import MoneyCalendar from './MoneyCalendar'
import MoneyDayModal from './MoneyDayModal'
import MoneyEntryModal from './MoneyEntryModal'
import MoneyPasswordModal from './MoneyPasswordModal'

export default function MoneyPage({ onExit, onLock }) {
  const [entries, setEntries] = useLocalStorage('schedule-app:money-entries', [])
  // 収入目標: { id, name, target }（nameは収入の項目名と紐づく）
  const [goals, setGoals] = useLocalStorage('schedule-app:money-goals', [])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modal, setModal] = useState(null)
  const [showPw, setShowPw] = useState(false)

  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')

  const mk = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEntries = entries.filter((e) => monthOf(e.date) === mk)
  const income = monthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = monthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const net = income - expense

  const nameSuggestions = [
    ...new Set([...goals.map((g) => g.name), ...entries.map((e) => e.name)]),
  ].filter(Boolean)

  const moveMonth = (diff) => {
    const d = new Date(year, month + diff, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const saveEntry = (entry) => {
    setEntries((prev) =>
      prev.some((e) => e.id === entry.id)
        ? prev.map((e) => (e.id === entry.id ? entry : e))
        : [...prev, entry],
    )
    setModal({ type: 'day', dateKey: entry.date })
  }

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setModal(modal ? { type: 'day', dateKey: modal.dateKey } : null)
  }

  const addGoal = (e) => {
    e.preventDefault()
    const target = Math.round(Number(goalTarget))
    if (!goalName.trim() || target <= 0) return
    setGoals((prev) => [...prev, { id: uid(), name: goalName.trim(), target }])
    setGoalName('')
    setGoalTarget('')
  }

  const removeGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id))

  return (
    <div className="app">
      <header className="app-header">
        <div className="money-title">
          <button className="back-btn" onClick={onExit}>
            ‹ スケジュール
          </button>
          <h1>お金の管理</h1>
        </div>
        <div className="month-nav">
          <button className="lock-btn" onClick={() => setShowPw(true)}>
            パスワード変更
          </button>
          <button className="lock-btn" onClick={onLock}>
            ロック
          </button>
          <button onClick={() => moveMonth(-1)} aria-label="前の月">
            ‹
          </button>
          <span className="month-label">
            {year}年{month + 1}月
          </span>
          <button onClick={() => moveMonth(1)} aria-label="次の月">
            ›
          </button>
        </div>
      </header>
      <main className="app-main">
        <MoneyCalendar
          year={year}
          month={month}
          entries={entries}
          onSelectDate={(dateKey) => setModal({ type: 'day', dateKey })}
        />
        <div className="sidebar">
          <aside className="money-summary-panel">
            <h2>📊 今月の収支</h2>
            <div className="money-summary">
              <div className="money-summary-row">
                <span>収入</span>
                <strong className="money-in">{formatYen(income)}</strong>
              </div>
              <div className="money-summary-row">
                <span>支出</span>
                <strong className="money-out">{formatYen(expense)}</strong>
              </div>
              <div className="money-summary-row net">
                <span>差引</span>
                <strong className={net >= 0 ? 'money-in' : 'money-out'}>{formatYen(net)}</strong>
              </div>
            </div>
          </aside>

          <aside className="money-goal-panel">
            <h2>🎯 収入の目標</h2>
            <p className="goal-hint">
              収入源ごとに月の目標額を決めると、その月の入金合計と達成率が出ます。項目名は収入の記録と同じ名前にすると集計されます。
            </p>
            <form className="goal-form" onSubmit={addGoal}>
              <input
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="収入源（例: バイト）"
                list="money-name-suggestions-goal"
              />
              <datalist id="money-name-suggestions-goal">
                {nameSuggestions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <div className="goal-form-row">
                <input
                  type="number"
                  min="0"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="月の目標額（円）"
                />
                <button type="submit" className="primary" disabled={!goalName.trim() || !goalTarget}>
                  追加
                </button>
              </div>
            </form>
            <ul className="money-goal-list">
              {goals.map((g) => {
                const actual = monthEntries
                  .filter((e) => e.type === 'income' && e.name === g.name)
                  .reduce((s, e) => s + e.amount, 0)
                const pct = Math.min(Math.round((actual / g.target) * 100), 100)
                const reached = actual >= g.target
                return (
                  <li key={g.id} className="money-goal-item">
                    <div className="money-goal-head">
                      <span className="money-goal-name">{g.name}</span>
                      <span className={`money-goal-pct ${reached ? 'done' : ''}`}>
                        {Math.round((actual / g.target) * 100)}%
                      </span>
                      <button
                        className="goal-delete"
                        onClick={() => removeGoal(g.id)}
                        aria-label="目標を削除"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="money-goal-bar">
                      <div
                        className={`money-goal-fill ${reached ? 'done' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="money-goal-meta">
                      {formatYen(actual)} / {formatYen(g.target)}
                    </div>
                  </li>
                )
              })}
              {goals.length === 0 && <li className="goal-empty">まだ目標がありません</li>}
            </ul>
          </aside>
        </div>
      </main>

      {modal?.type === 'day' && (
        <MoneyDayModal
          dateKey={modal.dateKey}
          entries={entries}
          onAdd={(defaultType) => setModal({ type: 'form', dateKey: modal.dateKey, defaultType })}
          onSelectEntry={(entry) => setModal({ type: 'form', dateKey: modal.dateKey, entry })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'form' && (
        <MoneyEntryModal
          dateKey={modal.dateKey}
          entry={modal.entry}
          defaultType={modal.defaultType}
          nameSuggestions={nameSuggestions}
          onSave={saveEntry}
          onDelete={deleteEntry}
          onClose={() => setModal({ type: 'day', dateKey: modal.dateKey })}
        />
      )}
      {showPw && <MoneyPasswordModal onClose={() => setShowPw(false)} />}
    </div>
  )
}
