import { useState } from 'react'
import { daysUntil, formatKey, uid } from '../utils'

export default function GoalPanel({ goals, setGoals }) {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')

  const addGoal = (e) => {
    e.preventDefault()
    if (!title.trim() || !deadline) return
    setGoals((prev) => [...prev, { id: uid(), title: title.trim(), deadline, done: false }])
    setTitle('')
    setDeadline('')
  }

  const toggle = (id) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))

  const remove = (id) => setGoals((prev) => prev.filter((g) => g.id !== id))

  // 未達成を締切が近い順に、達成済みは後ろへ
  const sorted = [...goals].sort((a, b) =>
    a.done !== b.done ? (a.done ? 1 : -1) : a.deadline.localeCompare(b.deadline),
  )

  return (
    <aside className="goal-panel">
      <h2>🎯 目標</h2>
      <p className="goal-hint">
        「◯月◯日までに達成したいこと」を登録すると、締切日のカレンダーにも表示されます。
      </p>
      <form className="goal-form" onSubmit={addGoal}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: ポートフォリオ完成"
        />
        <div className="goal-form-row">
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button type="submit" className="primary" disabled={!title.trim() || !deadline}>
            追加
          </button>
        </div>
      </form>
      <ul className="goal-list">
        {sorted.map((g) => {
          const days = daysUntil(g.deadline)
          let badge
          let badgeClass
          if (g.done) {
            badge = '達成 🎉'
            badgeClass = 'done'
          } else if (days > 0) {
            badge = `あと${days}日`
            badgeClass = days <= 3 ? 'soon' : 'later'
          } else if (days === 0) {
            badge = '今日まで！'
            badgeClass = 'soon'
          } else {
            badge = `${-days}日超過`
            badgeClass = 'overdue'
          }
          return (
            <li key={g.id} className={`goal-item ${g.done ? 'done' : ''}`}>
              <label className="goal-check">
                <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)} />
                <span className="goal-title">{g.title}</span>
              </label>
              <div className="goal-meta">
                <span className="goal-deadline">{formatKey(g.deadline)}まで</span>
                <span className={`goal-badge ${badgeClass}`}>{badge}</span>
                <button className="goal-delete" onClick={() => remove(g.id)} aria-label="目標を削除">
                  ✕
                </button>
              </div>
            </li>
          )
        })}
        {goals.length === 0 && <li className="goal-empty">まだ目標がありません</li>}
      </ul>
    </aside>
  )
}
