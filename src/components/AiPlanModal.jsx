import { useState } from 'react'
import { AI_COST_HINT } from '../config'
import { formatKey } from '../utils'

// 目標をAIが中間ステップに分解して提案するモーダル。
// 「提案してもらう」を押したときだけAI（＝課金）が動く。
export default function AiPlanModal({ goal, onAddSteps, onRecordUsage, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState(null) // [{ title, deadline, checked }]
  const [lastUsage, setLastUsage] = useState(null)

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: goal.title, deadline: goal.deadline }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AIの呼び出しに失敗しました。')
      setProposal(data.steps.map((s) => ({ ...s, checked: true })))
      setLastUsage(data.usage)
      onRecordUsage(data.usage.costYen)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (i) =>
    setProposal((prev) => prev.map((s, j) => (j === i ? { ...s, checked: !s.checked } : s)))

  const selected = proposal?.filter((s) => s.checked) ?? []

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✨ AIでプラン提案</h2>
        <p className="ai-hint">
          「🎯 {goal.title}（{formatKey(goal.deadline)}まで）」を達成するための中間ステップをAIが
          提案します（{AI_COST_HINT}）。
        </p>
        {error && <p className="ai-error">{error}</p>}
        {proposal && (
          <div className="ai-proposal">
            <h3>提案されたステップ（チェックしたものが追加されます）</h3>
            <ul className="ai-proposal-list">
              {proposal.map((s, i) => (
                <li key={i}>
                  <label className="ai-proposal-item">
                    <input type="checkbox" checked={s.checked} onChange={() => toggle(i)} />
                    <span className="ai-proposal-title">⚐ {s.title}</span>
                    <span className="ai-proposal-date">{formatKey(s.deadline)}まで</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        {lastUsage && (
          <p className="ai-cost-note">
            この提案のコスト: 約{lastUsage.costYen}円（入力{lastUsage.inputTokens}・出力
            {lastUsage.outputTokens}トークン）
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            閉じる
          </button>
          <span className="spacer" />
          <button type="button" className="primary" onClick={generate} disabled={loading}>
            {loading ? '考え中…' : proposal ? 'もう一度提案' : '提案してもらう'}
          </button>
          {proposal && (
            <button
              type="button"
              className="primary"
              onClick={() => onAddSteps(goal.id, selected.map(({ checked, ...s }) => s))}
              disabled={selected.length === 0}
            >
              {selected.length}件を追加
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
