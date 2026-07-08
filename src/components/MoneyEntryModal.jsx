import { useState } from 'react'
import { formatKey, uid } from '../utils'

// 収入・支出の1件を追加／編集するフォーム。
export default function MoneyEntryModal({ dateKey, entry, defaultType, nameSuggestions, onSave, onDelete, onClose }) {
  const [type, setType] = useState(entry?.type ?? defaultType ?? 'income')
  const [name, setName] = useState(entry?.name ?? '')
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '')
  const [memo, setMemo] = useState(entry?.memo ?? '')

  const amountNum = Math.round(Number(amount))
  const valid = name.trim() && amountNum > 0

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave({
      id: entry?.id ?? uid(),
      date: dateKey,
      type,
      name: name.trim(),
      amount: amountNum,
      memo: memo.trim(),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {formatKey(dateKey)} の{type === 'income' ? '収入' : '支出'}
          {entry ? 'を編集' : 'を追加'}
        </h2>
        <form onSubmit={submit}>
          <div className="money-type-toggle">
            <button
              type="button"
              className={type === 'income' ? 'active income' : ''}
              onClick={() => setType('income')}
            >
              収入
            </button>
            <button
              type="button"
              className={type === 'expense' ? 'active expense' : ''}
              onClick={() => setType('expense')}
            >
              支出
            </button>
          </div>
          <label className="field">
            項目名
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'income' ? '例: バイト給料' : '例: 家賃'}
              list="money-name-suggestions"
            />
            <datalist id="money-name-suggestions">
              {(nameSuggestions ?? []).map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label className="field">
            金額（円）
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 50000"
            />
          </label>
          <label className="field">
            メモ（任意）
            <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>
          <div className="modal-actions">
            {entry && (
              <button type="button" className="danger" onClick={() => onDelete(entry.id)}>
                削除
              </button>
            )}
            <span className="spacer" />
            <button type="button" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="primary" disabled={!valid}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
