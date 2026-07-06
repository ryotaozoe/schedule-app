import { useState } from 'react'
import { CATEGORIES } from '../categories'
import { formatKey, uid } from '../utils'

export default function EventModal({ dateKey, event, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(event?.title ?? '')
  const [category, setCategory] = useState(event?.category ?? CATEGORIES[0].id)
  const [time, setTime] = useState(event?.time ?? '')
  const [memo, setMemo] = useState(event?.memo ?? '')

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      id: event?.id ?? uid(),
      date: dateKey,
      title: title.trim(),
      category,
      time,
      memo: memo.trim(),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {formatKey(dateKey)} の予定{event ? 'を編集' : 'を追加'}
        </h2>
        <form onSubmit={submit}>
          <label className="field">
            タイトル
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: レポート提出"
            />
          </label>
          <fieldset className="category-picker">
            <legend>カテゴリ（文字色が変わります）</legend>
            <div className="category-options">
              {CATEGORIES.map((c) => (
                <label
                  key={c.id}
                  className={`category-option ${category === c.id ? 'selected' : ''}`}
                  style={{ '--cat-color': c.color }}
                >
                  <input
                    type="radio"
                    name="category"
                    value={c.id}
                    checked={category === c.id}
                    onChange={() => setCategory(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            時間（任意）
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="field">
            メモ（任意）
            <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>
          <div className="modal-actions">
            {event && (
              <button type="button" className="danger" onClick={() => onDelete(event.id)}>
                削除
              </button>
            )}
            <span className="spacer" />
            <button type="button" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="primary" disabled={!title.trim()}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
