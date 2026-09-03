"use client";

import { useState } from "react";

/**
 * 定性目標シート冒頭の「情意項目【5つの土台】」を表示する参照パネル。
 * スタッフが定性目標を記入する際の判断基準（会社の使命・理念・約束）を提示する。
 * 既定は開いた状態。長文のため折りたたみ可能にしている。
 */

const SERVICE_STANDARDS: { label: string; text: string }[] = [
  { label: "感謝", text: "一期一会の精神で、ご縁に感謝をする。" },
  { label: "信頼", text: "失うのは一瞬、取り戻すには一生。" },
  { label: "奉仕", text: "見返りを求めず、奉仕する喜びを感じる心を持つ。" },
  { label: "最善", text: "最高、最良を目指し最善を尽くす。" },
  { label: "貢献", text: "魅力ある価値を創造することで、地域に貢献する。" },
  { label: "公平", text: "公正な判断で公平を期する。" },
  { label: "共感", text: "コミュニケーションを惜しまず、相手の立場を立ち考える。" },
  { label: "遵守", text: "約束は期限内に必ず守る。" },
  { label: "迅速", text: "正確性を欠くことなく、スピーディーに対応する。" },
  { label: "感動", text: "良い意味での期待を裏切り、満足領域を超える。" },
];

const SELF_PROMISES: { no: string; title: string; lines: string[] }[] = [
  {
    no: "1）",
    title: "人格",
    lines: [
      "自分本位に物事を考えることなく、相手の気持ちや求めているものを理解し、共感する心を持つ。",
      "常に前向きで肯定的な思考をもち、自分の提供するサービスに自信を持ち、より多くの人に自分の価値を広める。",
    ],
  },
  {
    no: "2）",
    title: "マナー",
    lines: [
      "社会人としてのルールを遵守し、挨拶、身だしなみ、出欠勤、安全、5S（整理・整頓・清掃・清潔・躾）、電話対応、来客対応などと模範となるよう行動する。",
    ],
  },
  {
    no: "3）",
    title: "コミュニケーション",
    lines: [
      "相手の意見をよく聞き、自分の意見を述べ考えが違う場合は納得の行くまで話合い、関わることに恐れず常に良い雰囲気づくりを意識する。",
    ],
  },
  {
    no: "4）",
    title: "実行力",
    lines: ["否定的な思考にならず目的の意識を持って、計画にチャレンジすることを選択する。"],
  },
  {
    no: "5）",
    title: "逆算思考",
    lines: ["今やっていることが果たして効果的か、また効率的かを結果から逆算し創意工夫をする。"],
  },
  {
    no: "6）",
    title: "成長",
    lines: ["自分の限界を自分で決めず、可能性は無限であることを知り、仲間とともに切磋琢磨し努力する。"],
  },
  {
    no: "7）",
    title: "協力",
    lines: ["決して自分は一人ではなく、仲間がいることを忘れない。"],
  },
  {
    no: "8）",
    title: "自由",
    lines: ["一切の枠にとらわれず、自由な発想を阻害しない。"],
  },
];

const COMPANY_CREDO: string[] = [
  "一.私たちは、「一期一会」の精神で常に最高、最良、最善のサービスを提供します。",
  "一.私たちは、最高の商品を自らの人格を通じ、広く普及することをお約束します。",
  "一.私たちは、賃貸不動産経営を通じ、より良い住環境を整備し提供することで、社会に貢献することをお約束します。",
  "一.私たちは、仲間とともにより良い人間関係を創造し、素晴らしい人生を送ることをお約束します。",
];

export default function QualitativeFoundation({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-4 text-left"
      >
        <div>
          <p className="text-base font-black text-gray-900">定性目標</p>
          <p className="mt-0.5 text-xs font-bold text-gray-500">情意項目【5つの土台】</p>
        </div>
        <span className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
          {open ? "閉じる" : "開く"}
        </span>
      </button>

      {open && (
        <div className="space-y-6 px-5 py-5 text-sm leading-6 text-gray-700">
          <div>
            <h3 className="text-sm font-black text-gray-900">1. MISSION【使命】</h3>
            <p className="mt-1">
              私たちは「住まい」に関わる不動産サービスのプロとして、日頃から研鑽（努力）を惜しまず、お客様に満足を超えた感動を提供できるオンリーワン企業を目指します。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-gray-900">2. 企業理念【目的】</h3>
            <ul className="mt-1 space-y-1">
              {COMPANY_CREDO.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-gray-900">3. 顧客サービス基準</h3>
            <ul className="mt-1 space-y-1">
              {SERVICE_STANDARDS.map((item) => (
                <li key={item.label} className="flex gap-2">
                  <span className="w-10 shrink-0 font-bold text-gray-900">{item.label}</span>
                  <span>…{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-black text-gray-900">4. 顧客への約束</h3>
            <p className="mt-1">
              お客様の「住まい」に対する思いに真心をもってお応えし、お役に立てることが喜びであり、パートナーとして選んで頂いたことに誇りと責任感をもって、取り組むことをお約束いたします。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-gray-900">5. 自分への約束</h3>
            <div className="mt-2 space-y-3">
              {SELF_PROMISES.map((item) => (
                <div key={item.no}>
                  <p className="font-bold text-gray-900">
                    {item.no}【{item.title}】
                  </p>
                  {item.lines.map((line) => (
                    <p key={line} className="mt-0.5">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
