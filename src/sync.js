import { createClient } from '@supabase/supabase-js'

// Supabase（クラウド）の接続情報。
// Publishable（旧anon）キーはブラウザに置いてよい公開用キー。
const SUPABASE_URL = 'https://yneenhkbnpqicxewuqsn.supabase.co'
const SUPABASE_KEY = 'sb_publishable_1W-mRaAc81y5R7Whuwzo6w_BxQ7msGt'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 同期対象のデータ（localStorageのキー接尾辞）。
// 同期用の内部キー（sync-code / sync-snapshot / sync-at）は含めない。
const SYNC_KEYS = [
  'events',
  'goals',
  'favorites',
  'ai-usage',
  'memos',
  'money-entries',
  'money-goals',
  'money-pw',
]

const PREFIX = 'schedule-app:'
const CODE_KEY = PREFIX + 'sync-code'
const SNAP_KEY = PREFIX + 'sync-snapshot'
const AT_KEY = PREFIX + 'sync-at'

// ---- 同期コード ----
export function getCode() {
  return localStorage.getItem(CODE_KEY) || ''
}
export function setCode(c) {
  localStorage.setItem(CODE_KEY, c)
}
export function clearCode() {
  localStorage.removeItem(CODE_KEY)
  localStorage.removeItem(SNAP_KEY)
  localStorage.removeItem(AT_KEY)
}
export function getLastSyncAt() {
  const v = Number(localStorage.getItem(AT_KEY))
  return v > 0 ? v : null
}
function setLastSyncAt() {
  localStorage.setItem(AT_KEY, String(Date.now()))
}

// ---- ローカルデータの集約／書き戻し ----
// blob は { キー: 保存文字列 or null } の形。値はlocalStorageの生の文字列のまま扱う。
function gather() {
  const blob = {}
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(PREFIX + k)
    blob[k] = v == null ? null : v
  }
  return blob
}
function applyBlob(blob) {
  for (const k of SYNC_KEYS) {
    const v = blob ? blob[k] : null
    if (v == null) localStorage.removeItem(PREFIX + k)
    else localStorage.setItem(PREFIX + k, v)
  }
}
// 比較用の決定的な文字列（キー順は固定）
function blobKey(blob) {
  return JSON.stringify(SYNC_KEYS.map((k) => (blob && blob[k] != null ? blob[k] : null)))
}

function getSnapshot() {
  try {
    return JSON.parse(localStorage.getItem(SNAP_KEY)) || {}
  } catch {
    return {}
  }
}
function setSnapshot(blob) {
  localStorage.setItem(SNAP_KEY, JSON.stringify(blob))
}

// 前回同期時（snapshot）を基準に、ローカルとクラウドをキー単位で統合する。
// 片方だけ変わっていればそちらを採用。両方変わっていればクラウド優先（まれ）。
function merge(snap, local, remote) {
  const out = {}
  for (const k of SYNC_KEYS) {
    const s = snap && snap[k] != null ? snap[k] : null
    const l = local && local[k] != null ? local[k] : null
    const r = remote && remote[k] != null ? remote[k] : null
    if (l === r) out[k] = l
    else if (l === s) out[k] = r
    else if (r === s) out[k] = l
    else out[k] = r
  }
  return out
}

// ---- クラウド読み書き ----
async function pullRemote(code) {
  const { data, error } = await supabase
    .from('app_sync')
    .select('data,updated_at')
    .eq('code', code)
    .maybeSingle()
  if (error) throw error
  return data // { data: blob, updated_at } または null
}
async function pushRemote(code, blob) {
  const { error } = await supabase
    .from('app_sync')
    .upsert({ code, data: blob, updated_at: new Date().toISOString() }, { onConflict: 'code' })
  if (error) throw error
}

// クラウドと1回同期する。クラウド側の内容を取り込む必要があれば
// localStorageを書き換えてページを再読み込みする（Reactに反映するため）。
export async function syncNow() {
  const code = getCode()
  if (!code) return { ok: false, reason: 'no-code' }

  const local = gather()
  const localArr = blobKey(local)

  let remote
  try {
    remote = await pullRemote(code)
  } catch (error) {
    return { ok: false, reason: 'error', error }
  }

  // クラウドにまだ無ければ、この端末のデータで初期化
  if (!remote) {
    try {
      await pushRemote(code, local)
    } catch (error) {
      return { ok: false, reason: 'error', error }
    }
    setSnapshot(local)
    setLastSyncAt()
    return { ok: true, action: 'seeded' }
  }

  const remoteBlob = remote.data || {}
  const merged = merge(getSnapshot(), local, remoteBlob)
  const mergedArr = blobKey(merged)

  // 統合結果がクラウドと違えば、クラウドを更新
  if (mergedArr !== blobKey(remoteBlob)) {
    try {
      await pushRemote(code, merged)
    } catch (error) {
      return { ok: false, reason: 'error', error }
    }
  }
  setSnapshot(merged)
  setLastSyncAt()

  // ローカルを更新する必要があれば書き換えて再読み込み
  if (mergedArr !== localArr) {
    applyBlob(merged)
    location.reload()
    return { ok: true, action: 'pulled' }
  }
  return { ok: true, action: 'in-sync' }
}

// 変更があればクラウドへ送るだけ（再読み込みしない。定期実行用）
export async function autoPush() {
  const code = getCode()
  if (!code) return
  const local = gather()
  if (blobKey(local) === blobKey(getSnapshot())) return
  try {
    await pushRemote(code, local)
    setSnapshot(local)
    setLastSyncAt()
  } catch {
    // 通信失敗時は次回に任せる
  }
}
