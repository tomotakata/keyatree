import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AssistMode = "suggest" | "refine" | "generate";

type AssistBody = {
  kind?: "quantitative" | "qualitative";
  mode?: AssistMode;
  stepTitle?: string;
  section?: string;
  prompt?: string;
  currentValue?: string;
  answers?: Record<string, string>;
};

const MODEL = "gpt-4o-mini";

const BASE_SYSTEM = `あなたは不動産会社「KeyaTree」の社員向け目標設定コーチです。
OKR/目標管理の専門家として、社員が「目標→Why(動機)→KR(主要な結果)→現状と課題→具体行動→支援設計」を
一貫性のある形で言語化できるよう支援します。

コーチングの原則:
- 回答は必ず日本語で、丁寧だが簡潔に。
- 現在フォーカスしている1つの項目についてだけ出力する（他の項目の説明や前置き・見出しは書かない）。
- 具体的・行動可能・測定可能な表現を優先する。
- これまでの回答（文脈）と矛盾しない内容にする。
- KRは可能なら数値や期限を含める。行動は「いつ・何を・どれくらい」を含む具体行動にする。
- 出力はそのまま入力欄に貼り付けて使える本文のみ。カギ括弧や「例：」などの接頭辞は付けない。`;

function buildContext(answers: Record<string, string> | undefined): string {
  if (!answers) return "（まだ他の回答はありません）";
  const entries = Object.entries(answers).filter(([, v]) => v && v.trim());
  if (entries.length === 0) return "（まだ他の回答はありません）";
  return entries.map(([k, v]) => `- ${k}: ${v}`).join("\n");
}

function buildUserPrompt(body: AssistBody): string {
  const { mode = "suggest", stepTitle, section, prompt, currentValue, answers } = body;
  const context = buildContext(answers);
  const header = `【これまでの回答（文脈）】\n${context}\n\n【現在の項目】\nセクション: ${section ?? ""}\nステップ: ${stepTitle ?? ""}\n質問: ${prompt ?? ""}`;

  if (mode === "refine") {
    return `${header}\n\n【ユーザーの現在の入力】\n${currentValue ?? "(空)"}\n\n上記の入力を、より具体的で伝わりやすい表現に添削してください。意味は保ったまま、1つの完成された本文として出力してください。`;
  }
  if (mode === "generate") {
    return `${header}\n\nこの項目の内容を、これまでの回答を踏まえて自動生成してください。1つの完成された本文として出力してください。`;
  }
  return `${header}\n\nこの項目に対する回答案を1つ提案してください。これまでの回答を踏まえ、そのまま入力欄に使える本文として出力してください。`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  let body: AssistBody;
  try {
    body = (await request.json()) as AssistBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 600,
        messages: [
          { role: "system", content: BASE_SYSTEM },
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
        apiMessage = parsed?.error?.message ?? "";
      } catch {
        // detail was not JSON
      }

      let friendly = `OpenAI APIエラー (${res.status})`;
      if (res.status === 429) {
        if (code === "insufficient_quota") {
          friendly =
            "OpenAIの利用枠（クレジット残高）が不足しています。OpenAIダッシュボードの Billing で支払い方法の登録／クレジットの追加が必要です。";
        } else {
          friendly =
            "OpenAIのレート制限に達しました。少し時間をおいて再度お試しください。";
        }
      } else if (res.status === 401) {
        friendly = "OpenAI APIキーが無効です。キーを確認してください。";
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
