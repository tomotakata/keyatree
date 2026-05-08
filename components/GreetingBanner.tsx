"use client";

import { useEffect, useState } from "react";
import { Employee } from "@/lib/mockData";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getGreetingMessages(employee: Employee): string[] {
  const hour = new Date().getHours();
  const name = employee.name.split(" ")[0];

  const topGoal = [...employee.goals].sort((a, b) => b.progress - a.progress)[0];
  const lowGoal = [...employee.goals].sort((a, b) => a.progress - b.progress)[0];
  const avgProgress = Math.round(
    employee.goals.reduce((sum, g) => sum + g.progress, 0) / employee.goals.length
  );
  const thanksCount = employee.thanks.length;

  // 目標関連メッセージ
  const goalMessages = [
    `「${topGoal.title}」の進捗が${topGoal.progress}%！この調子で行きましょう！`,
    `目標の平均進捗は${avgProgress}%です。着実に前進していますね。`,
    topGoal.progress >= 80
      ? `「${topGoal.title}」はゴール目前の${topGoal.progress}%！あと一踏ん張りです！`
      : `「${lowGoal.title}」、一緒に伸ばしていきましょう！`,
    `今日の積み重ねが、明日の目標達成につながっています。`,
    `小さな進歩も大きな成果への第一歩。焦らず着実に！`,
    `目標に向かって動いているだけで、それはもう立派な成果です。`,
  ];

  // サンクス関連メッセージ
  const thanksMessages = [
    `${name}さんへのサンクスカードが${thanksCount}件届いています！みんなに感謝されていますね。`,
    `チームのみんなが${name}さんのことを頼りにしています。`,
    `感謝を受け取ることも、感謝を伝えることも、組織を強くします。`,
    `${name}さんの存在がチームの力になっています。`,
  ];

  // 時間帯ごとの挨拶メッセージ
  const timeMessages: string[] = [];
  if (hour >= 5 && hour < 11) {
    timeMessages.push(
      `おはようございます、${name}さん！今日も一日よろしくお願いします。`,
      `おはようございます！今日も元気にいきましょう、${name}さん！`,
      `朝から来てくれてありがとう、${name}さん。今日もよろしく！`,
      `清々しい朝ですね。${name}さん、今日も頑張りましょう！`,
      `${name}さん、今日という日は一度しかありません。一緒に良い一日にしましょう！`,
    );
  } else if (hour >= 11 && hour < 14) {
    timeMessages.push(
      `こんにちは、${name}さん！ランチはしっかり食べましたか？`,
      `お昼ですね、${name}さん。午後も一緒に頑張りましょう！`,
      `午前中もお疲れ様でした。休憩をしっかり取ってくださいね。`,
      `ランチタイムは英気を養う大事な時間。しっかり食べてください！`,
      `${name}さん、今日の午前中も丁寧な仕事をありがとう！`,
    );
  } else if (hour >= 14 && hour < 18) {
    timeMessages.push(
      `${name}さん、午後もお疲れ様です！`,
      `もうひと踏ん張り、${name}さんならできます！`,
      `午後の時間帯が一番集中できる人も多いですよ。`,
      `${name}さん、今日もチームのために動いてくれてありがとう！`,
      `終業まであと少し。丁寧に、着実に仕上げていきましょう！`,
      `${name}さんのペースで大丈夫。焦らず進めていきましょう。`,
    );
  } else if (hour >= 18 && hour < 22) {
    timeMessages.push(
      `${name}さん、今日も本当にお疲れ様でした！`,
      `今日もよく頑張りました、${name}さん。ゆっくり休んでください。`,
      `一日の終わりに、今日の自分を少し褒めてあげてくださいね。`,
      `${name}さんが今日動いたことは、必ず明日につながっています。`,
      `今日も一日、本当にありがとうございました！また明日も一緒に頑張りましょう。`,
    );
  } else {
    timeMessages.push(
      `${name}さん、遅い時間までお疲れ様です。`,
      `無理せず、しっかり休んでくださいね。`,
      `深夜までありがとう、${name}さん。体を大切に。`,
      `夜遅くまでお疲れ様です。今日も一日よく頑張りました。`,
    );
  }

  // 全プールをシャッフルして先頭4〜5件を返す
  const pool = [...timeMessages, ...goalMessages, ...thanksMessages];
  return shuffle(pool).slice(0, 5);
}

export default function GreetingBanner({ employee }: { employee: Employee }) {
  const [messages] = useState(() => getGreetingMessages(employee));
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let msgIdx = 0;
    let charIdx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const type = () => {
      const msg = messages[msgIdx];
      if (charIdx < msg.length) {
        charIdx++;
        setDisplayText(msg.slice(0, charIdx));
        timer = setTimeout(type, 45);
      } else {
        timer = setTimeout(erase, 2500);
      }
    };

    const erase = () => {
      const msg = messages[msgIdx];
      if (charIdx > 0) {
        charIdx--;
        setDisplayText(msg.slice(0, charIdx));
        timer = setTimeout(erase, 18);
      } else {
        msgIdx = (msgIdx + 1) % messages.length;
        timer = setTimeout(type, 300);
      }
    };

    timer = setTimeout(type, 400);
    return () => clearTimeout(timer);
  }, [messages]);

  const hour = new Date().getHours();
  const icon =
    hour >= 5 && hour < 11 ? "☀️" : hour >= 11 && hour < 18 ? "✨" : "🌙";

  return (
    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <p className="text-sm text-white font-bold min-h-[1.25rem] drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] tracking-wide">
          {displayText}
          <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse align-middle opacity-80" />
        </p>
      </div>
    </div>
  );
}
