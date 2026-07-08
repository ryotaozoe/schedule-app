import { useState } from 'react'
import { hashPassword } from '../money'

const PW_KEY = 'schedule-app:money-pw'

function loadPwHash() {
  try {
    return JSON.parse(localStorage.getItem(PW_KEY)) ?? ''
  } catch {
    return ''
  }
}

// お金ページのパスワードゲート。
// パスワード未設定なら「設定」、設定済みなら「入力」画面を出す。
// ※ブラウザ内だけの簡易ロック（本気の第三者からは守れない）。
// 保存はlocalStorageへ直接書く（設定直後にこの画面ごと消えるため、
// useLocalStorageのuseEffect経由だと書き込む前にアンマウントされてしまう）。
export default function MoneyLock({ onUnlock, onCancel }) {
  const [pwHash] = useState(loadPwHash)
  const isSetup = !pwHash

  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!pw) return
    setBusy(true)
    try {
      if (isSetup) {
        if (pw.length < 4) {
          setError('パスワードは4文字以上にしてください。')
          return
        }
        if (pw !== confirm) {
          setError('確認用パスワードが一致しません。')
          return
        }
        localStorage.setItem(PW_KEY, JSON.stringify(await hashPassword(pw)))
        onUnlock()
      } else {
        const h = await hashPassword(pw)
        if (h === pwHash) {
          onUnlock()
        } else {
          setError('パスワードが違います。')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <h2>🔒 お金の管理</h2>
        <p className="lock-hint">
          {isSetup
            ? '最初にパスワードを設定してください。以降このページを開くときに必要になります。'
            : 'パスワードを入力してください。'}
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={isSetup ? '新しいパスワード（4文字以上）' : 'パスワード'}
          />
          {isSetup && (
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="確認のためもう一度"
            />
          )}
          {error && <p className="lock-error">{error}</p>}
          <p className="lock-note">
            ※ブラウザ内だけの簡易ロックです。大切な情報は保存しすぎないようにしてください。
          </p>
          <div className="lock-actions">
            <button type="button" onClick={onCancel}>
              戻る
            </button>
            <span className="spacer" />
            <button type="submit" className="primary" disabled={busy || !pw}>
              {isSetup ? '設定して開く' : '開く'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
