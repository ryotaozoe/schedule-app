import { categoryById } from '../categories'
import { useLocalStorage } from '../hooks/useLocalStorage'

// メモを分ける項目（授業・学校 / 勉強 / 就活 / プライベート / その他）。
// ラベルと色はカテゴリ定義から引くので、色を変えればここも連動する。
const MEMO_CATEGORY_IDS = ['class', 'study', 'job', 'private', 'other']

// 旧バージョンの1枚メモ（schedule-app:memo）に書いた内容があれば「その他」へ引き継ぐ
function initialMemos() {
  const base = Object.fromEntries(MEMO_CATEGORY_IDS.map((id) => [id, '']))
  try {
    const old = localStorage.getItem('schedule-app:memo')
    if (old) {
      const text = JSON.parse(old)
      if (typeof text === 'string' && text.trim()) return { ...base, other: text }
    }
  } catch {
    // 壊れていても空メモで続行
  }
  return base
}

// カレンダーとは無関係の自由記入欄。項目ごとに分かれ、入力するたびに自動保存される。
export default function MemoPanel() {
  const [memos, setMemos] = useLocalStorage('schedule-app:memos', initialMemos())

  const update = (id, value) => setMemos((prev) => ({ ...prev, [id]: value }))

  return (
    <aside className="memo-panel">
      <h2>📝 メモ</h2>
      <p className="memo-hint">項目ごとに自由に書けるフリースペースです。自動で保存されます。</p>
      <div className="memo-sections">
        {MEMO_CATEGORY_IDS.map((id) => {
          const cat = categoryById(id)
          return (
            <div key={id} className="memo-section">
              <span className="memo-label" style={{ color: cat.color }}>
                <span className="memo-dot" style={{ background: cat.color }} />
                {cat.label}
              </span>
              <textarea
                className="memo-area"
                value={memos[id] ?? ''}
                onChange={(e) => update(id, e.target.value)}
                placeholder={`${cat.label}のメモ`}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}
