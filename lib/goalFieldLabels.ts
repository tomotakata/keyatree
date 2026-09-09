/**
 * 目標設定（定量）・定性目標シートの保存キー → 日本語ラベル変換。
 * 承認確認画面などで内部キー（q_comp_2 等）がそのまま表示されるのを防ぐ。
 * 動的キー（q_*_N / q_*_N_M）にも対応する。
 */

const CIRCLED = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
const circ = (n: number) => CIRCLED[n] ?? `(${n})`;

// 固定キー
const STATIC_LABELS: Record<string, string> = {
  name: "名前",
  org: "所属",
  department: "所属",
  team: "所属チーム",
  stage: "ステージ",
  grade: "グレード",
  category: "定性目標カテゴリ",
  competency: "コンピテンシー",
  deadline: "期限",
  goal: "目標文",
  action1: "具体行動①",
  action2: "具体行動②",
  action3: "具体行動③",
  confirm: "補足メモ",
  current: "現状",
  entry_date: "記入日",
  // 定量目標
  company_item: "全社定量目標：目標項目",
  company_deadline: "全社定量目標：目標達成期日",
  company_value: "全社定量目標：目標数値",
  company_progress: "全社定量目標：進捗数値",
  company_result: "全社定量目標：結果数値",
  team_item: "チーム定量目標：目標項目",
  team_deadline: "チーム定量目標：目標達成期日",
  team_value: "チーム定量目標：目標数値",
  team_progress: "チーム定量目標：進捗数値",
  team_result: "チーム定量目標：結果数値",
  personal_item: "個人定量目標：目標項目",
  personal_deadline: "個人定量目標：目標達成期日",
  personal_value: "個人定量目標：目標数値",
  personal_progress: "個人定量目標：進捗数値",
  personal_result: "個人定量目標：結果数値",
};

// 動的キー（N=項目番号1..5, M=サブ番号）
const DYNAMIC: { re: RegExp; label: (m: RegExpMatchArray) => string }[] = [
  { re: /^q_comp_(\d+)$/, label: (m) => `会社から求められている能力項目${circ(+m[1])}` },
  { re: /^q_kr_item_(\d+)$/, label: (m) => `主要な結果${circ(+m[1])}：項目` },
  { re: /^q_kr_num_(\d+)$/, label: (m) => `主要な結果${circ(+m[1])}：数字` },
  { re: /^q_kr_action_(\d+)$/, label: (m) => `主要な結果${circ(+m[1])}を達成するための行動` },
  { re: /^q_supporter_date_(\d+)_(\d+)$/, label: (m) => `支援者${circ(+m[1])}：依頼日 ${m[2]}` },
  { re: /^q_supporter_(\d+)_(\d+)$/, label: (m) => `支援者${circ(+m[1])}：依頼者 ${m[2]}` },
  { re: /^q_support_content_(\d+)$/, label: (m) => `支援内容${circ(+m[1])}` },
  { re: /^q_mid_result_(\d+)$/, label: (m) => `中間実績${circ(+m[1])}【数字】` },
  { re: /^q_month_result_(\d+)$/, label: (m) => `月間実績${circ(+m[1])}【数字】` },
  { re: /^q_month_cause_(\d+)_(\d+)$/, label: (m) => `月間原因${circ(+m[1])}-${m[2]}` },
  { re: /^q_month_action_(\d+)_(\d+)$/, label: (m) => `月間改善策${circ(+m[1])}-${m[2]}` },
  { re: /^q_msg_self_(\d+)$/, label: (m) => `自己評価者メッセージ${circ(+m[1])}` },
  { re: /^q_msg_first_(\d+)$/, label: (m) => `一次評価者メッセージ${circ(+m[1])}` },
  { re: /^q_msg_second_(\d+)$/, label: (m) => `二次評価者メッセージ${circ(+m[1])}` },
  { re: /^q_self_(\d+)$/, label: (m) => `自己評価${circ(+m[1])}` },
  { re: /^q_first_(\d+)$/, label: (m) => `一次評価${circ(+m[1])}` },
  { re: /^q_second_(\d+)$/, label: (m) => `二次評価${circ(+m[1])}` },
];

export function labelForField(key: string): string {
  if (STATIC_LABELS[key]) return STATIC_LABELS[key];
  for (const { re, label } of DYNAMIC) {
    const m = key.match(re);
    if (m) return label(m);
  }
  return key;
}
