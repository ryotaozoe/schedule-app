// アプリ全体の設定値。ここを変えると挙動を調整できる

// 空き時間の計算に使う活動時間帯（この範囲の中で予定が入っていない時間を「空き」とする）
export const ACTIVITY_START_HOUR = 9
export const ACTIVITY_END_HOUR = 24

// 時間未設定・終了時間なしの予定を集計するときの所要時間（時間）
export const DEFAULT_EVENT_HOURS = 2

// AI機能の月間予算（円）。メーターの上限として使う
export const AI_MONTHLY_BUDGET_YEN = 300

// AI1回あたりのおおよそのコスト表示（Sonnet 5・円換算の目安）
export const AI_COST_HINT = '1回 約2〜3円'
