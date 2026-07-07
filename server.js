// AI機能用の小さなAPIサーバー。
// APIキーをブラウザに渡さないため、Claude APIの呼び出しはすべてここを経由する。
// キーはプロジェクト直下の .env ファイル（gitには入れない）から読み込む。
import 'dotenv/config'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

const PORT = 3001
const MODEL = 'claude-sonnet-5'

// 料金計算用の定数。Sonnet 5 の正規価格（入力$3 / 出力$15 per 100万トークン）で
// 計算する。2026年8月末まではキャンペーン価格（$2/$10）なので、実際の請求は
// この表示より安くなる（メーターは安全側に多めに見積もる方針）。
const INPUT_USD_PER_MTOK = 3
const OUTPUT_USD_PER_MTOK = 15
const YEN_PER_USD = 150

const app = express()
app.use(express.json())

// キー未設定でもサーバー自体は起動できるよう、初回リクエスト時に初期化する
let client = null
function getClient() {
  if (!client) client = new Anthropic() // .env の ANTHROPIC_API_KEY を自動で読む
  return client
}

// 実際のトークン数から1回分のコスト（円）を計算する
function costYen(usage) {
  const usd =
    (usage.input_tokens * INPUT_USD_PER_MTOK + usage.output_tokens * OUTPUT_USD_PER_MTOK) /
    1_000_000
  return Math.round(usd * YEN_PER_USD * 100) / 100
}

function usagePayload(response) {
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costYen: costYen(response.usage),
  }
}

// 'YYYY-MM-DD' と曜日（今日の日付情報。相対日付の解決に使う）
function todayInfo() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
  return { key: `${y}-${m}-${d}`, weekday }
}

function ensureApiKey(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({
      error:
        'APIキーが設定されていません。プロジェクト直下に .env ファイルを作り、ANTHROPIC_API_KEY=sk-ant-... を書いてサーバーを再起動してください。',
    })
    return false
  }
  return true
}

// 最初のtextブロックからJSONを取り出す（構造化出力なので必ず有効なJSON）
function parseTextJson(response) {
  if (response.stop_reason === 'refusal') {
    throw new Error('AIがこのリクエストの処理を拒否しました。内容を変えて試してください。')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('出力が長すぎて途中で切れました。文章を短くして試してください。')
  }
  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('AIから有効な応答が得られませんでした。')
  return JSON.parse(text)
}

const CATEGORY_GUIDE =
  'class=授業・学校, baito=バイト, side=副業（Web制作・noteなど）, job=就活（説明会・面接・ES提出など）, private=プライベート, other=その他'

// ---------- 自然文 → 予定リスト ----------

const eventsSchema = {
  type: 'object',
  properties: {
    events: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '予定の日付 YYYY-MM-DD' },
          title: { type: 'string', description: '予定の短いタイトル' },
          category: {
            type: 'string',
            enum: ['class', 'baito', 'side', 'job', 'private', 'other'],
          },
          time: { type: 'string', description: '開始時間 HH:MM（24時間表記）。不明なら空文字' },
          endTime: { type: 'string', description: '終了時間 HH:MM。不明なら空文字' },
          memo: { type: 'string', description: '補足情報。なければ空文字' },
        },
        required: ['date', 'title', 'category', 'time', 'endTime', 'memo'],
        additionalProperties: false,
      },
    },
  },
  required: ['events'],
  additionalProperties: false,
}

app.post('/api/parse-events', async (req, res) => {
  if (!ensureApiKey(res)) return
  const text = (req.body?.text ?? '').trim()
  if (!text) return res.status(400).json({ error: '文章を入力してください。' })
  if (text.length > 1000) {
    return res.status(400).json({ error: '文章が長すぎます（1000文字まで）。' })
  }

  const today = todayInfo()
  const system = `あなたはスケジュール管理アプリの予定入力アシスタント。ユーザーが日本語の自然な文章で書いた予定を、構造化データに変換する。

今日は ${today.key}（${today.weekday}曜日）。

ルール:
- 「明日」「来週」「金曜」などの相対的な日付は今日を基準に解決する。曜日だけ書かれた場合は直近の未来のその曜日とする
- 「月水金」のような複数曜日や「毎週」の表現は、該当する日付ごとに個別の予定として展開する。期間の指定がない「毎週」は今後4週間分
- 大学の授業の「n限」は 1限=9:00〜10:30, 2限=10:40〜12:10, 3限=13:00〜14:30, 4限=14:40〜16:10, 5限=16:20〜17:50 とする
- 時間が読み取れない場合 time と endTime は空文字にする
- カテゴリの基準: ${CATEGORY_GUIDE}
- 文章から読み取れない情報を勝手に補わない`

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'disabled' },
      output_config: { effort: 'low', format: { type: 'json_schema', schema: eventsSchema } },
      system,
      messages: [{ role: 'user', content: text }],
    })
    const data = parseTextJson(response)
    res.json({ events: data.events, usage: usagePayload(response) })
  } catch (err) {
    console.error('parse-events error:', err)
    res.status(500).json({ error: err.message ?? 'AIの呼び出しに失敗しました。' })
  }
})

// ---------- 目標 → 中間ステップ提案 ----------

const planSchema = {
  type: 'object',
  properties: {
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'ステップ名（15文字程度まで）' },
          deadline: { type: 'string', description: 'ステップの締切 YYYY-MM-DD' },
        },
        required: ['title', 'deadline'],
        additionalProperties: false,
      },
    },
  },
  required: ['steps'],
  additionalProperties: false,
}

app.post('/api/plan-goal', async (req, res) => {
  if (!ensureApiKey(res)) return
  const title = (req.body?.title ?? '').trim()
  const deadline = (req.body?.deadline ?? '').trim()
  if (!title || !deadline) {
    return res.status(400).json({ error: '目標のタイトルと締切日が必要です。' })
  }

  const today = todayInfo()
  const system = `あなたは目標達成の計画づくりを手伝うアシスタント。大学生のユーザーの目標を、現実的な中間ステップ（3〜6個）に分解する。

今日は ${today.key}。

ルール:
- 各ステップに締切日（YYYY-MM-DD）を設定する。今日より後、目標の締切日以前にする
- 期間全体にバランスよく配分し、最後のステップは目標の締切日かその直前にする
- ステップ名は簡潔に（15文字程度まで）
- 大学生の生活（授業・バイトと両立）を前提にした現実的な粒度で`

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: planSchema } },
      system,
      messages: [{ role: 'user', content: `目標: ${title}\n締切日: ${deadline}` }],
    })
    const data = parseTextJson(response)
    res.json({ steps: data.steps, usage: usagePayload(response) })
  } catch (err) {
    console.error('plan-goal error:', err)
    res.status(500).json({ error: err.message ?? 'AIの呼び出しに失敗しました。' })
  }
})

app.listen(PORT, () => {
  console.log(`AI APIサーバー起動: http://localhost:${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠ ANTHROPIC_API_KEY が未設定です。.env ファイルを作成してください。')
  }
})
