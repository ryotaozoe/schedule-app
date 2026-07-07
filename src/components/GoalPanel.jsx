import { useState } from 'react'
import { daysUntil, formatKey, uid } from '../utils'

export default function GoalPanel({ goals, setGoals, onRequestPlan }) {
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  // ステップ追加フォームを開いている目標のID（nullなら閉じている）
  const [stepFormFor, setStepFormFor] = useState(null)
  const [stepTitle, setStepTitle] = useState('')
  const [stepDeadline, setStepDeadline] = useState('')

  const addGoal = (e) => {
    e.preventDefault()
    if (!title.trim() || !deadline) return
    setGoals((prev) => [
      ...prev,
      { id: uid(), title: title.trim(), deadline, done: false, steps: [] },
    ])
    setTitle('')
    setDeadline('')
  }

  const toggle = (id) =>
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))

  const remove = (id) => setGoals((prev) => prev.filter((g) => g.id !== id))

  const openStepForm = (goalId) => {
    setStepFormFor(goalId)
    setStepTitle('')
    setStepDeadline('')
  }

  const addStep = (goalId) => {
    if (!stepTitle.trim() || !stepDeadline) return
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              steps: [
                ...(g.steps ?? []),
                { id: uid(), title: stepTitle.trim(), deadline: stepDeadline, done: false },
              ],
            }
          : g,
      ),
    )
    setStepFormFor(null)
  }

  const toggleStep = (goalId, stepId) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, steps: g.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) }
          : g,
      ),
    )

  const removeStep = (goalId, stepId) =>
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, steps: g.steps.filter((s) => s.id !== stepId) } : g,
      ),
    )

  // 未達成を締切が近い順に、達成済みは後ろへ
  const sorted = [...goals].sort((a, b) =>
    a.done !== b.done ? (a.done ? 1 : -1) : a.deadline.localeCompare(b.deadline),
  )

  return (
    <aside className="goal-panel">
      <h2>🎯 目標</h2>
      <p className="goal-hint">
        「◯月◯日までに達成したいこと」を登録すると、締切日のカレンダーにも表示されます。
        「＋ステップ」で中間ステップに分解して、逆算で進めましょう。
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
          const steps = [...(g.steps ?? [])].sort((a, b) => a.deadline.localeCompare(b.deadline))
          const doneCount = steps.filter((s) => s.done).length
          return (
            <li key={g.id} className={`goal-item ${g.done ? 'done' : ''}`}>
              <label className="goal-check">
                <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)} />
                <span className="goal-title">{g.title}</span>
              </label>
              <div className="goal-meta">
                <span className="goal-deadline">{formatKey(g.deadline)}まで</span>
                <span className={`goal-badge ${badgeClass}`}>{badge}</span>
                {steps.length > 0 && (
                  <span className="step-progress">
                    {doneCount}/{steps.length}
                  </span>
                )}
                <button className="goal-delete" onClick={() => remove(g.id)} aria-label="目標を削除">
                  ✕
                </button>
              </div>
              {steps.length > 0 && (
                <ul className="step-list">
                  {steps.map((s) => (
                    <li key={s.id} className={`step-item ${s.done ? 'done' : ''}`}>
                      <label className="step-check">
                        <input
                          type="checkbox"
                          checked={s.done}
                          onChange={() => toggleStep(g.id, s.id)}
                        />
                        <span className="step-title">{s.title}</span>
                      </label>
                      <span className="step-deadline">{formatKey(s.deadline)}</span>
                      <button
                        className="goal-delete"
                        onClick={() => removeStep(g.id, s.id)}
                        aria-label="ステップを削除"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {stepFormFor === g.id ? (
                <div className="step-form">
                  <input
                    autoFocus
                    value={stepTitle}
                    onChange={(e) => setStepTitle(e.target.value)}
                    placeholder="例: デザイン決め"
                  />
                  <div className="goal-form-row">
                    <input
                      type="date"
                      value={stepDeadline}
                      max={g.deadline}
                      onChange={(e) => setStepDeadline(e.target.value)}
                    />
                    <button
                      type="button"
                      className="primary"
                      disabled={!stepTitle.trim() || !stepDeadline}
                      onClick={() => addStep(g.id)}
                    >
                      追加
                    </button>
                    <button type="button" onClick={() => setStepFormFor(null)}>
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                !g.done && (
                  <div className="goal-actions">
                    <button className="step-add" onClick={() => openStepForm(g.id)}>
                      ＋ ステップを追加
                    </button>
                    <button className="step-add ai" onClick={() => onRequestPlan(g)}>
                      ✨ AIでプラン提案
                    </button>
                  </div>
                )
              )}
            </li>
          )
        })}
        {goals.length === 0 && <li className="goal-empty">まだ目標がありません</li>}
      </ul>
    </aside>
  )
}
