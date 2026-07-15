import { useState } from 'react'
import { callAi } from '../api'
import { categoryById } from '../categories'
import { AI_COST_HINT } from '../config'
import { formatKey, timeRangeLabel } from '../utils'

// 自然な文章から予定を一括登録するモーダル。
// 解析ボタンを押したときだけAI（＝課金）が動く。登録前に内容を確認できる。
export default function AiEventModal({ onAdd, onRecordUsage, onClose }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // 解析結果: [{ ...event, checked: true }]
  const [proposal, setProposal] = useState(null)
  const [lastUsage, setLastUsage] = useState(null)

  const parse = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await callAi('/api/parse-events', { text })
      setProposal(data.events.map((ev) => ({ ...ev, checked: true })))
      setLastUsage(data.usage)
      onRecordUsage(data.usage.costYen)
      if (data.events.length === 0) {
        setError('予定を読み取れませんでした。日付や内容をもう少し具体的に書いてみてください。')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (i) =>
    setProposal((prev) => prev.map((ev, j) => (j === i ? { ...ev, checked: !ev.checked } : ev)))

  const selected = proposal?.filter((ev) => ev.checked) ?? []

  const register = () => {
    onAdd(selected.map(({ checked, ...ev }) => ev))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✨ AIで予定登録</h2>
        <p className="ai-hint">
          予定を自然な文章で書くと、AIが解析してまとめて登録できます（{AI_COST_HINT}）。
        </p>
        <textarea
          className="ai-textarea"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'例: 来週の月水金は3限に統計の授業、金曜は18時から22時までカフェバイト'}
          disabled={loading}
        />
        {error && <p className="ai-error">{error}</p>}
        {proposal && proposal.length > 0 && (
          <div className="ai-proposal">
            <h3>解析結果（チェックした予定が登録されます）</h3>
            <ul className="ai-proposal-list">
              {proposal.map((ev, i) => {
                const cat = categoryById(ev.category)
                const timeLabel = timeRangeLabel(ev)
                return (
                  <li key={i}>
                    <label className="ai-proposal-item">
                      <input type="checkbox" checked={ev.checked} onChange={() => toggle(i)} />
                      <span className="ai-proposal-date">{formatKey(ev.date)}</span>
                      {timeLabel && <span className="ai-proposal-time">{timeLabel}</span>}
                      <span className="ai-proposal-title" style={{ color: cat.color }}>
                        {ev.title}
                      </span>
                      <span
                        className="day-event-cat"
                        style={{ background: `${cat.color}1a`, color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {lastUsage && (
          <p className="ai-cost-note">
            この解析のコスト: 約{lastUsage.costYen}円（入力{lastUsage.inputTokens}・出力
            {lastUsage.outputTokens}トークン）
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            閉じる
          </button>
          <span className="spacer" />
          <button
            type="button"
            className="primary"
            onClick={parse}
            disabled={loading || !text.trim()}
          >
            {loading ? '解析中…' : proposal ? 'もう一度解析' : '解析する'}
          </button>
          {proposal && proposal.length > 0 && (
            <button
              type="button"
              className="primary"
              onClick={register}
              disabled={selected.length === 0}
            >
              {selected.length}件を登録
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
