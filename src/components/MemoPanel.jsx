import { useLocalStorage } from '../hooks/useLocalStorage'

// カレンダーとは無関係の自由記入欄。入力するたびに自動保存される。
export default function MemoPanel() {
  const [memo, setMemo] = useLocalStorage('schedule-app:memo', '')

  return (
    <aside className="memo-panel">
      <h2>📝 メモ</h2>
      <p className="memo-hint">なんでも自由に書けるフリースペースです。自動で保存されます。</p>
      <textarea
        className="memo-area"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="アイディア、買い物リスト、気になったことなど何でもどうぞ"
      />
    </aside>
  )
}
