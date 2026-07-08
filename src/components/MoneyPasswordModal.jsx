import { useState } from 'react'
import { hashPassword } from '../money'

// パスワード変更モーダル（すでにロック解除済みの状態から使う）。
// MoneyLockと同じく、確実に残るようlocalStorageへ直接書き込む。
export default function MoneyPasswordModal({ onClose }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.length < 4) {
      setError('パスワードは4文字以上にしてください。')
      return
    }
    if (pw !== confirm) {
      setError('確認用パスワードが一致しません。')
      return
    }
    setBusy(true)
    try {
      localStorage.setItem('schedule-app:money-pw', JSON.stringify(await hashPassword(pw)))
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>パスワードの変更</h2>
        {done ? (
          <>
            <p className="lock-hint">パスワードを変更しました。</p>
            <div className="modal-actions">
              <span className="spacer" />
              <button type="button" className="primary" onClick={onClose}>
                閉じる
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="新しいパスワード（4文字以上）"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="確認のためもう一度"
            />
            {error && <p className="lock-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" onClick={onClose}>
                キャンセル
              </button>
              <span className="spacer" />
              <button type="submit" className="primary" disabled={busy || !pw}>
                変更する
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
