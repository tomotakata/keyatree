"use client";

import { useEffect } from "react";

/** 鈴木一郎（employee 001）のデモ用承認済みデータをlocalStorageにシードする */
export default function SeedGoalData({ employeeId }: { employeeId: string }) {
  useEffect(() => {
    if (employeeId !== "001") return;

    const SEED_FLAG = "keyatree_seed_goal_v1_001";
    if (window.localStorage.getItem(SEED_FLAG)) return; // 既にシード済み

    // --- 承認日・進捗ログ日時を現在から逆算して生成 ---
    const now = Date.now();
    const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

    // ===== 定量目標設定シート =====
    const quantRecord = {
      recordId: "seed-quant-001",
      status: "approved",
      approvedAt: daysAgo(21),
      savedAt: daysAgo(22),
      answers: {
        name: "鈴木 一郎",
        department: "営業部 > 第一営業課",
        deadline: "2026年9月末",
        goal: "売上3,000万円達成と顧客満足度向上を両立する",
        why1: "個人目標達成だけでなく、チーム全体の成果向上につなげたいからです。",
        why2: "売上と満足度を両立できれば、紹介案件が増え、継続的に成果が出せます。",
        why3: "現状は売上重視になりやすく、フォロー品質にばらつきが出る場面があるためです。",
        why4: "成果だけでなく、信頼される営業として評価されることに大きな意味があります。",
        purpose:
          "2026年9月末までに「売上3,000万円達成と顧客満足度向上を両立する」を実現する。背景には売上と信頼の両立があり、その実現を通じて継続的な紹介獲得と営業品質向上を前進させる。",
        kr1: "月間売上 3,000万円達成",
        kr2: "紹介案件比率 25%以上",
        kr3: "顧客満足度アンケート 4.7以上",
        state1: "現在の月間売上は平均2,150万円です。",
        issue1: "月初の商談数が不足し、月末に数字を追う傾向があります。",
        state2: "現在の紹介案件比率は18%です。",
        issue2: "成約後の紹介依頼が仕組み化されていません。",
        state3: "現在の顧客満足度平均は4.3です。",
        issue3: "初回ヒアリング内容の記録にばらつきがあります。",
        action11: "毎週月曜9時に見込み顧客20件へ連絡する。",
        action12: "毎日17時に商談進捗を記録し、週次で売上見込みを更新する。",
        action13: "毎週金曜に上長へ案件進捗レビューを依頼する。",
        action21: "成約後3日以内に紹介依頼メッセージを送る。",
        action22: "毎週2件、既存顧客へフォロー連絡を行う。",
        action23: "紹介成功事例を毎週朝礼で共有する。",
        action31: "初回面談後30分以内にヒアリングメモを入力する。",
        action32: "週1回、顧客対応の振り返りを上長と実施する。",
        action33: "アンケート低評価案件を当日中に確認し改善策を記録する。",
        support: "上長に週1回の進捗レビューと、顧客対応フィードバックを依頼する。",
      },
    };

    // ===== 定性目標設定シート =====
    const qualRecord = {
      recordId: "seed-qual-001",
      status: "approved",
      approvedAt: daysAgo(18),
      savedAt: daysAgo(19),
      answers: {
        name: "鈴木 一郎",
        department: "営業部 > 第一営業課",
        deadline: "2026年9月末",
        goal: "チームリーダーとしての行動力・傾聴力を高め、後輩育成に貢献する",
        stage: "リーダー",
        grade: "S3",
        category: "チームマネジメント",
        competency_no: "C-042",
        competency_text:
          "メンバーの強みを把握し、それぞれの成長段階に応じた関わり方ができている。",
        action1: "毎週月曜に後輩1名と15分の1on1を実施し、業務の困りごとを確認する。",
        action2: "月に1回、チーム内ロールプレイング練習会を企画・運営する。",
        action3:
          "自分の商談録音を週1件振り返り、改善点を翌週の行動に反映させる。",
      },
    };

    // ===== 進捗ログ（定量目標） =====
    const quantLogs = [
      {
        loggedAt: daysAgo(14),
        progress:
          "月初の見込み顧客リストを整備し、月曜連絡の習慣が定着。2週間で商談数が前月比+3件に増加。売上見込みは2,400万円に改善。",
        challenge:
          "紹介依頼の声かけタイミングが成約直後に集中し、まだ仕組み化には至っていない。",
      },
      {
        loggedAt: daysAgo(7),
        progress:
          "紹介依頼メッセージのテンプレートを作成し、成約後3日以内の送付を開始。今週2件の紹介案件を獲得。紹介比率が20%に上昇。",
        challenge:
          "顧客満足度アンケートの回収率がまだ低く、4.3から改善が見えにくい状況。",
      },
    ];

    // ===== 進捗ログ（定性目標） =====
    const qualLogs = [
      {
        loggedAt: daysAgo(10),
        progress:
          "後輩の田中さんと週次1on1を開始。業務の困りごとを早期にキャッチできるようになり、商談前のサポートが円滑になった。",
        challenge: "ロールプレイング練習会の日程調整がまだできていない。来週中に設定する。",
      },
    ];

    // localStorageへ書き込み
    window.localStorage.setItem(
      "keyatree_goal_navigator_draft",
      JSON.stringify(quantRecord)
    );
    window.localStorage.setItem(
      "keyatree_qualitative_goal_navigator_draft",
      JSON.stringify(qualRecord)
    );
    window.localStorage.setItem(
      `keyatree_progress_logs_${quantRecord.recordId}`,
      JSON.stringify(quantLogs)
    );
    window.localStorage.setItem(
      `keyatree_progress_logs_${qualRecord.recordId}`,
      JSON.stringify(qualLogs)
    );

    window.localStorage.setItem(SEED_FLAG, "1");

    // ProgressReminderに再描画を促すためにカスタムイベントを発火
    window.dispatchEvent(new Event("keyatree_seed_done"));
  }, [employeeId]);

  return null;
}
