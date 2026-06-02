import Link from "next/link";

const docs = [
  {
    id: "tech-overview",
    href: "/docs/tech-overview",
    label: "TECH",
    color: "from-emerald-500 to-teal-500",
    title: "技術構成・インフラ環境および予算概算",
    desc: "開発言語・フレームワーク・インフラ構成・セキュリティ方針・費用概算・開発ロードマップ。",
    tags: ["Next.js", "Vercel", "Supabase", "費用概算"],
    date: "2025.05",
    status: "公開中",
  },
  {
    id: "infra-qa",
    href: "/docs/infra-qa.html",
    label: "Q&A",
    color: "from-blue-500 to-indigo-500",
    title: "インフラ・運用・セキュリティに関するご質問事項への回答書",
    desc: "Supabase、運用保守、ランニングコスト、SLA、バックアップ、IP制限、操作ログなどへの提出用回答資料。",
    tags: ["提出用", "セキュリティ", "運用保守", "SLA"],
    date: "2025.05",
    status: "公開中",
  },
  {
    id: "goal-navigator-requirements",
    href: "/docs/goal-navigator-requirements.html",
    label: "REQ",
    color: "from-emerald-500 to-teal-500",
    title: "目標設定ナビゲーター機能 要件定義書",
    desc: "定量目標設定ナビゲーターの進行フロー、画面要件、データ要件、AI利用範囲、出力要件を整理した要件定義資料。",
    tags: ["要件定義", "定量目標", "評価運用"],
    date: "2025.06",
    status: "公開中",
  },
  {
    id: "goal-navigator-demo",
    href: "/demo/goal-navigator",
    label: "DEMO",
    color: "from-emerald-500 to-teal-500",
    title: "目標設定ナビゲーター デモ画面",
    desc: "1問ずつ進みながら目標設定を行い、最終レポート生成まで体験できるインタラクティブデモ。",
    tags: ["デモ", "ウィザードUI", "定量目標"],
    date: "2025.06",
    status: "公開中",
  },
  {
    id: "qualitative-goal-navigator-requirements",
    href: "/docs/qualitative-goal-navigator-requirements.html",
    label: "REQ",
    color: "from-blue-500 to-indigo-500",
    title: "定性目標設定ナビゲーター機能 要件定義書",
    desc: "PDF準拠のステージ・グレード・カテゴリ・コンピテンシーを基盤とした定性目標設定ナビゲーターの要件定義資料。",
    tags: ["要件定義", "定性目標", "PDF準拠"],
    date: "2025.06",
    status: "公開中",
  },
  {
    id: "dev-log-01",
    href: null,
    label: "LOG",
    color: "from-amber-400 to-orange-500",
    title: "開発ログ #01 — フェーズ1 実装記録",
    desc: "社員詳細・一覧・登録・認証・マスター管理の実装内容と意思決定の記録。",
    tags: ["実装記録", "フェーズ1"],
    date: "準備中",
    status: "準備中",
  },
  {
    id: "db-design",
    href: null,
    label: "DB",
    color: "from-blue-500 to-indigo-500",
    title: "DB設計書 — Supabase スキーマ定義",
    desc: "テーブル定義・リレーション・インデックス・RLSポリシーの設計書。フェーズ2作成予定。",
    tags: ["PostgreSQL", "Supabase", "フェーズ2"],
    date: "準備中",
    status: "準備中",
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">K</span>
          </Link>
          <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 text-sm font-medium">開発ドキュメント</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">開発ドキュメント</h1>
          <p className="text-sm text-gray-500 mt-1">技術資料・開発ログ・設計書の一覧です。ドキュメントを読んだら読了確認をお願いします。</p>
        </div>

        <div className="space-y-3">
          {docs.map((doc) => {
            const card = (
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${doc.href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-50"}`}>
                <div className={`h-1 bg-gradient-to-r ${doc.color}`} />
                <div className="flex items-center gap-5 p-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-black font-mono tracking-tight">{doc.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800">{doc.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{doc.desc}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {doc.tags.map(t => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${doc.status === "公開中" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {doc.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{doc.date}</p>
                  </div>
                </div>
              </div>
            );

            return doc.href ? (
              <Link key={doc.id} href={doc.href}>{card}</Link>
            ) : (
              <div key={doc.id}>{card}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
