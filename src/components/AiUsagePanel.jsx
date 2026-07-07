import { AI_COST_HINT, AI_MONTHLY_BUDGET_YEN } from '../config'
import { monthKey } from '../utils'

// 今月のAI利用回数と実測コスト（円換算）を予算と比べて表示するパネル。
// コストはAPIが返した実際のトークン数から計算した値の累計。
export default function AiUsagePanel({ usage }) {
  const current = usage[monthKey()] ?? { count: 0, yen: 0 }
  const ratio = Math.min(current.yen / AI_MONTHLY_BUDGET_YEN, 1)
  const level = ratio >= 0.9 ? 'danger' : ratio >= 0.7 ? 'warn' : 'ok'

  return (
    <aside className="ai-usage-panel">
      <h2>🤖 AI利用状況</h2>
      <p className="ai-usage-main">
        今月 <strong>{current.count}回</strong>・約 <strong>{Math.round(current.yen * 10) / 10}円</strong>
        <span className="ai-usage-budget"> / 予算{AI_MONTHLY_BUDGET_YEN}円</span>
      </p>
      <div className="ai-usage-bar">
        <div className={`ai-usage-fill ${level}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      {current.yen >= AI_MONTHLY_BUDGET_YEN ? (
        <p className="ai-usage-note over">今月の予算を超えました。来月まで手入力がおすすめです。</p>
      ) : (
        <p className="ai-usage-note">
          {AI_COST_HINT}・手入力は何回でも0円。あと約
          {Math.max(Math.floor((AI_MONTHLY_BUDGET_YEN - current.yen) / 2.5), 0)}回使えます
        </p>
      )}
    </aside>
  )
}
