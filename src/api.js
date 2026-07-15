const AI_UNAVAILABLE =
  'AI機能はローカルで起動したとき（npm run dev）のみ使えます。ネット公開版では無効です。'

// AIサーバー(/api/...)を呼ぶ共通処理。
// 公開版（静的ホスティング）にはAIサーバーが無いため、
// 404のHTMLや通信失敗を分かりやすいメッセージに変換して投げる。
export async function callAi(path, body) {
  let res
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    // サーバーに到達できない（公開版など）
    throw new Error(AI_UNAVAILABLE)
  }
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // JSON以外（404ページのHTMLなど）＝AIサーバーが無い
    throw new Error(AI_UNAVAILABLE)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'AIの呼び出しに失敗しました。')
  return data
}
