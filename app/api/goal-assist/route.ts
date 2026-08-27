import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AssistMode = "suggest" | "refine" | "generate" | "coach";

type AssistBody = {
  kind?: "quantitative" | "qualitative";
  mode?: AssistMode;
  stepKey?: string;
  stepTitle?: string;
  section?: string;
  prompt?: string;
  currentValue?: string;
  answers?: Record<string, string>;
};

// KIE AI 経由で最適な LLM を利用する。
// 既定は gpt-5.2（KIE のモデルパス/モデル名は "gpt-5-2"）。環境変数 KIE_MODEL で上書き可能。
const MODEL = process.env.KIE_MODEL || "gpt-5-2";
// KIE の chat completions エンドポイントは https://api.kie.ai/{model}/v1/chat/completions
const KIE_BASE = process.env.KIE_BASE_URL || "https://api.kie.ai";

// ─────────────────────────────────────────────────────────────
// マイGPT「目標設定ナビゲーター（定量）」の思考プロセスを再現するシステムプロンプト
// ─────────────────────────────────────────────────────────────
const QUANT_SYSTEM = `あなたは不動産会社「K.AI（けやき不動産）」の社員専用の目標設定コーチAI「目標設定ナビゲーター」です。
これはOpenAIのGPTとして設計された対話型コーチを、そのまま社内ツールに移植したものです。あなたの役割・語り口・思考プロセスは元のGPTと完全に一致させます。

# あなたの人格・スタンス
- 相手を一人の営業／担当者として尊重し、上から目線にならない。伴走者として、問いかけと言語化の支援を行う。
- 断定や説教はしない。相手の言葉を活かし、より具体的・行動可能・測定可能な形に磨き上げる。
- 常に丁寧な日本語。簡潔で、実務でそのまま使える表現にする。

# 全体の設計思想（OKR × Why深掘り）
社員が次の一貫した流れで目標を言語化できるように支援する：
目標（ひと言）→ Why(動機を4層で深掘り)→ 目的と目標の統合 → KR(主要な結果=測定可能)→ 現状(事実)と課題 → 具体行動(いつ・何を・どれくらい)→ 支援設計(誰に・何を・どの頻度で)

# 各ステップで守る原則
- 目標(goal): 状態や成果を「ひと言」で表す。抽象語だけで終わらせず、方向性が伝わる一文にする。
- Why(why1→why4): 動機のはしご登り。前の回答を必ず踏まえ、1段ずつ深い層へ導く。why1=達成したい理由 / why2=実現時の良い変化 / why3=その変化が必要な背景 / why4=取り組む一番大きな意味。本人の内発的動機・価値観に触れる。
- 統合(purpose): 期限・目標・Whyを1つの文章に統合する。フォーマット例:「〈期限〉までに『〈目標〉』を実現する。背景には〈動機の核〉があり、その実現を通じて〈もたらす変化〉を前進させる。」
- KR(kr1〜3): 必ず測定可能。数値・比率・期限のいずれかを含める。目標に直結し、3つは互いに重複させない。
- 現状(state): 意見や課題を混ぜず、事実・数値のみを短く述べる。
- 課題(issue): そのKRが未達になっているボトルネック・根本原因を特定する。現状との差分に着目する。
- 行動(action): 対応するKR・課題に紐づく具体行動。「いつ(頻度/曜日/時刻)・何を・どれくらい」を必ず含める。実行可能な粒度にする。
- 支援設計(support): 「誰に・どんな支援を・どの頻度で」依頼するかを明確にする（例: 上長に週1回の進捗レビューを依頼する）。

# 出力ルール（厳守）
- 出力は日本語。今フォーカスしている「1つの項目」の本文のみを返す。
- 見出し・前置き・「例：」「回答：」などの接頭辞・カギ括弧での囲みは付けない。そのまま入力欄へ貼れる本文だけを返す。
- これまでの回答（文脈）と矛盾しない内容にする。`;

// ─────────────────────────────────────────────────────────────
// マイGPT「定性目標設定ナビゲーター」の思考プロセスを再現するシステムプロンプト
// ─────────────────────────────────────────────────────────────
const QUAL_SYSTEM = `あなたは不動産会社「K.AI（けやき不動産）」の社員専用の定性目標設定コーチAI「定性目標設定ナビゲーター」です。
これはOpenAIのGPTとして設計された対話型コーチを社内ツールへ移植したもので、語り口・思考プロセスを元のGPTと完全に一致させます。

# あなたの人格・スタンス
- 伴走者として、行動レベルの言語化を支援する。断定や説教はしない。丁寧で簡潔な日本語。

# 全体の設計思想（コンピテンシー準拠）
社員は「ステージ(Stage)→グレード(Grade)→カテゴリ→コンピテンシー」を選び、それに沿った定性目標(行動目標)を設計する。
定性目標は数値ではなく「望ましい行動・状態」で表す。ただし曖昧にせず、観察可能で再現できる行動に落とし込む。
流れ: 目標(選んだコンピテンシーを体現する状態)→ 具体行動×3(いつ・何を・どれくらい)→ 最終確認。

# 各ステップで守る原則
- 目標(goal): 選択された「コンピテンシー文」と「ステージ/グレード」に整合する行動目標を、本人の担当業務に即した一文で表す。数値ではなく行動・状態で表現する。
- 具体行動(action1〜3): そのコンピテンシーを日常業務で体現する行動。「いつ(頻度/タイミング)・何を・どれくらい」を必ず含め、観察可能にする。3つは重複させない。
- 最終確認(confirm): これまでの内容を一文で要約し、本人が集中すべき行動の焦点を確認する。

# ステージ観点（目安）
- Stage 1 基礎遂行: 指示・基準に沿って確実に遂行する行動。
- Stage 2 自律推進: 自ら判断し、周囲と連携して前に進める行動。
- Stage 3 周囲牽引: 周囲を巻き込み、基準や仕組みを引き上げる行動。

# 出力ルール（厳守）
- 出力は日本語。今フォーカスしている「1つの項目」の本文のみを返す。
- 見出し・前置き・接頭辞・カギ括弧での囲みは付けない。そのまま入力欄へ貼れる本文だけを返す。
- これまでの回答（文脈）や選択したコンピテンシーと矛盾しない内容にする。`;

// ─────────────────────────────────────────────────────────────
// マイGPTの「対話での確認・サポート」を再現するシステムプロンプト（coachモード共通）
// 入力欄用の本文ではなく、伴走コーチとしての受け止め・承認・一言アドバイスを返す
// ─────────────────────────────────────────────────────────────
const COACH_SYSTEM = `あなたは不動産会社「K.AI（けやき不動産）」の社員専用の目標設定コーチAI「目標設定ナビゲーター」です。
これはOpenAIのGPTとして設計された対話型コーチをそのまま社内ツールに移植したもので、語り口・伴走スタンスを元のGPTと完全に一致させます。

# この応答の役割（重要）
いま社員が「現在の項目」に入力した回答に対して、対話コーチとして声をかけます。入力欄に貼るための本文ではなく、"コーチのひとこと"を返します。

# 応答の型（毎回この流れ・全体で2〜4文・自然な日本語）
1. 受け止め・承認: 相手の入力を一度きちんと受け止め、良い点を具体的に1つ認める（例:「なるほど、〜という思いなんですね。とても良い視点です。」）。
2. 確認/深掘り or 磨き込みの提案: この項目の狙いに照らして、あと一歩良くするための具体的な観点を1つだけ、やわらかく提案するか、次の一歩へつなぐ問いを1つ投げる（例:「もう一歩だけ、〜を数値で表すとさらに伝わりますよ。」）。
3. 押しつけない: 断定・説教・長い列挙はしない。あくまで伴走者として、相手の言葉を活かす。

# 禁止事項
- 箇条書きや見出しは使わず、話し言葉の短い段落で返す。
- 相手の入力を丸ごと書き直して提示しない（それは別機能）。ヒントや方向性だけを示す。
- 入力が空のときは、責めずに、この項目で何を書くとよいかを1つの問いかけで促す。`;

// 定量ナビ: ステップ別の追加ガイド
function quantStepGuide(stepKey: string): string {
  if (stepKey === "goal")
    return "この項目は『目標（ひと言）』です。成果や到達状態が伝わる、簡潔で前向きな一文にしてください。";
  if (stepKey.startsWith("why")) {
    const layer: Record<string, string> = {
      why1: "第1層『達成したい理由』。素直な動機を短く言語化してください。",
      why2: "第2層『実現したときの良い変化』。why1を踏まえ、自分やチームに起きる良い変化を描いてください。",
      why3: "第3層『その変化が必要な背景』。why1・why2を踏まえ、なぜ今それが必要かの背景を掘り下げてください。",
      why4: "第4層『取り組む一番大きな意味』。これまでのWhyを統合し、本人の価値観に触れる核心を一文で示してください。",
    };
    return layer[stepKey] ?? "Whyを1段深掘りしてください。";
  }
  if (stepKey === "purpose")
    return "この項目は『目的と目標の統合文』です。期限・目標・Whyを1つの文章に統合してください。フォーマット:『〈期限〉までに『〈目標〉』を実現する。背景には〈動機〉があり、その実現を通じて〈変化〉を前進させる。』";
  if (stepKey.startsWith("kr"))
    return "この項目は『KR（主要な結果）』です。必ず数値・比率・期限のいずれかを含む測定可能な指標にしてください。目標に直結し、他のKRと重複させないでください。";
  if (stepKey.startsWith("state"))
    return "この項目は『現状（事実）』です。意見や課題を混ぜず、対応するKRの現在値・事実だけを短く述べてください。";
  if (stepKey.startsWith("issue"))
    return "この項目は『課題』です。対応するKRが未達になっているボトルネックや根本原因を、現状との差分から特定してください。";
  if (stepKey.startsWith("action"))
    return "この項目は『具体行動』です。対応するKR・課題に紐づけ、『いつ（頻度/曜日/時刻）・何を・どれくらい』を必ず含む実行可能な行動にしてください。";
  if (stepKey === "support")
    return "この項目は『支援設計』です。『誰に・どんな支援を・どの頻度で』依頼するかを明確にしてください。";
  return "現在の項目に対して、これまでの回答と整合する具体的な本文を作成してください。";
}

// 定性ナビ: ステップ別の追加ガイド
function qualStepGuide(stepKey: string): string {
  if (stepKey === "goal")
    return "この項目は『定性目標（行動目標）』です。選択したコンピテンシー文とステージ/グレードに整合し、本人の担当業務に即した、観察可能な行動・状態の一文にしてください。数値目標にはしないでください。";
  if (stepKey.startsWith("action"))
    return "この項目は『具体行動』です。選んだコンピテンシーを日常業務で体現する行動を、『いつ・何を・どれくらい』を含めて観察可能な形にしてください。他の行動と重複させないでください。";
  if (stepKey === "confirm")
    return "この項目は『最終確認』です。これまでの目標と行動を一文で要約し、本人が集中すべき行動の焦点を確認してください。";
  return "現在の項目に対して、選択したコンピテンシーと整合する具体的な本文を作成してください。";
}

function buildContext(answers: Record<string, string> | undefined): string {
  if (!answers) return "（まだ他の回答はありません）";
  const entries = Object.entries(answers).filter(([, v]) => v && v.trim());
  if (entries.length === 0) return "（まだ他の回答はありません）";
  return entries.map(([k, v]) => `- ${k}: ${v}`).join("\n");
}

function buildUserPrompt(body: AssistBody): string {
  const {
    kind = "quantitative",
    mode = "suggest",
    stepKey = "",
    stepTitle,
    section,
    prompt,
    currentValue,
    answers,
  } = body;
  const context = buildContext(answers);
  const guide = kind === "qualitative" ? qualStepGuide(stepKey) : quantStepGuide(stepKey);

  const header = `【これまでの回答（文脈）】\n${context}\n\n【現在の項目】\nセクション: ${section ?? ""}\nステップ: ${stepTitle ?? ""}\n質問: ${prompt ?? ""}\n\n【この項目のコーチング方針】\n${guide}`;

  if (mode === "coach") {
    return `${header}\n\n【ユーザーが今この項目に入力した内容】\n${currentValue?.trim() ? currentValue : "(まだ空欄です)"}\n\n上記の入力に対して、目標設定ナビゲーターとして"コーチのひとこと"を返してください。受け止め・承認から入り、この項目をあと一歩良くするための観点を1つだけ、やわらかく伝えてください。話し言葉で2〜4文にまとめてください。`;
  }
  if (mode === "refine") {
    return `${header}\n\n【ユーザーの現在の入力】\n${currentValue ?? "(空)"}\n\nこの入力を、上記の方針に沿って、より具体的で伝わりやすい表現に添削してください。本人の意図を保ったまま、1つの完成された本文として出力してください。`;
  }
  if (mode === "generate") {
    return `${header}\n\nこの項目の内容を、これまでの回答と上記の方針を踏まえて自動生成してください。1つの完成された本文として出力してください。`;
  }
  return `${header}\n\nこの項目に対する回答案を1つ提案してください。これまでの回答と上記の方針を踏まえ、そのまま入力欄に使える本文として出力してください。`;
}

export async function POST(request: Request) {
  const apiKey = process.env.KIE_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KIE_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  let body: AssistBody;
  try {
    body = (await request.json()) as AssistBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const system =
    body.mode === "coach"
      ? COACH_SYSTEM
      : body.kind === "qualitative"
        ? QUAL_SYSTEM
        : QUANT_SYSTEM;

  try {
    const res = await fetch(`${KIE_BASE}/${MODEL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: buildUserPrompt(body) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      let code = "";
      let apiMessage = "";
      try {
        const parsed = JSON.parse(detail);
        code = parsed?.error?.code ?? parsed?.error?.type ?? "";
        apiMessage = parsed?.error?.message ?? parsed?.message ?? "";
      } catch {
        // detail was not JSON
      }

      let friendly = `AI APIエラー (${res.status})`;
      if (res.status === 429) {
        friendly =
          "KIE AI の利用枠（クレジット残高）が不足しているか、レート制限に達しました。KIE ダッシュボードで残高を確認してください。";
      } else if (res.status === 401 || res.status === 403) {
        friendly = "KIE AI の APIキーが無効です。キーを確認してください。";
      } else if (res.status === 404) {
        friendly = `モデル「${MODEL}」が利用できません。KIE_MODEL の設定を確認してください。`;
      }

      return NextResponse.json(
        { error: friendly, code, detail: apiMessage.slice(0, 300) },
        { status: res.status }
      );
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
