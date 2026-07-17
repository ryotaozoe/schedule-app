import { useState } from 'react'
import { clearCode, getCode, getLastSyncAt, setCode, syncNow } from '../sync'

function formatTime(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const m = String(d.getMonth() + 1)
  const day = String(d.getDate())
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${hh}:${mm}`
}

// 端末間データ同期のUI。同じ同期コードを入れた端末どうしでデータを共有する。
export default function SyncPanel() {
  const [code, setCodeState] = useState(getCode())
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [lastAt, setLastAt] = useState(getLastSyncAt())

  const start = async () => {
    const c = input.trim()
    if (c.length < 4) {
      setStatus('コードは4文字以上にしてください。')
      return
    }
    setBusy(true)
    setStatus('同期中…')
    setCode(c)
    setCodeState(c)
    const r = await syncNow() // クラウドにデータがあればここで再読み込みされる
    setBusy(false)
    setLastAt(getLastSyncAt())
    if (!r.ok && r.reason === 'error') {
      setStatus('接続に失敗しました。通信環境を確認してもう一度お試しください。')
    } else {
      setStatus('同期を開始しました。他の端末でも同じコードを入れてください。')
    }
  }

  const manual = async () => {
    setBusy(true)
    setStatus('同期中…')
    const r = await syncNow()
    setBusy(false)
    setLastAt(getLastSyncAt())
    setStatus(r.ok ? '最新の状態にしました。' : '同期に失敗しました。通信を確認してください。')
  }

  const disconnect = () => {
    clearCode()
    setCodeState('')
    setLastAt(null)
    setStatus('この端末の同期を解除しました（データはこの端末に残ります）。')
  }

  return (
    <aside className="sync-panel">
      <h2>☁️ 端末間の同期</h2>
      {!code ? (
        <>
          <p className="goal-hint">
            好きな合言葉（同期コード）を決めて、PC・スマホなど使う端末すべてに同じものを入れると、予定やお金のデータが共有されます。
          </p>
          <div className="goal-form">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="同期コード（4文字以上・自分で決める）"
            />
            <button
              type="button"
              className="primary"
              onClick={start}
              disabled={busy || input.trim().length < 4}
            >
              {busy ? '同期中…' : '同期を開始'}
            </button>
          </div>
          <p className="sync-note">
            ※最初に「今のデータが入っている端末」で設定すると、そのデータがクラウドに保存され、他の端末にも反映されます。合言葉は簡易ロックです（知っている人は見られます）。
          </p>
        </>
      ) : (
        <>
          <p className="sync-status">
            同期中：<span className="sync-code">{code}</span>
          </p>
          {lastAt && <p className="sync-last">最終同期 {formatTime(lastAt)}</p>}
          <div className="sync-actions">
            <button type="button" className="primary" onClick={manual} disabled={busy}>
              {busy ? '同期中…' : '今すぐ同期'}
            </button>
            <button type="button" onClick={disconnect} disabled={busy}>
              解除
            </button>
          </div>
        </>
      )}
      {status && <p className="sync-msg">{status}</p>}
    </aside>
  )
}
