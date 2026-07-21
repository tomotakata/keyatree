import HeaderNav from "@/components/HeaderNav";
import Link from "next/link";

type Feature = {
  id: string;
  href: string | null;
  label: string;
  color: string;
  title: string;
  desc: string;
  tags: string[];
  status: "公開中" | "開発中" | "準備中";
};

const features: Feature[] = [
  {
    id: "floorplan-demo",
    href: "/demo/floorplan",
    label: "PLAN",
    color: "from-sky-500 to-teal-500",
    title: "間取り作成（フロアプラン）",
    desc: "部屋・壁・建具・記号を配置し、重なり順の調整やSVG/PNG/PDF/JSON出力までできる間取り作成エディタのデモ画面。",
    tags: ["デモ", "間取り作成", "SVG出力"],
    status: "開発中",
  },
  {
    id: "floorplan-property",
    href: "/properties",
    label: "PROP",
    color: "from-emerald-500 to-teal-500",
    title: "物件管理 → 間取り作成",
    desc: "物件一覧 → 物件詳細 → 間取り作成の実運用フロー。下書き保存・テンプレート保存に対応。",
    tags: ["物件管理", "間取り作成"],
    status: "公開中",
  },
  {
    id: "goal-navigator-demo",
    href: "/demo/goal-navigator",
    label: "GOAL",
    color: "from-emerald-500 to-teal-500",
    title: "目標設定ナビゲーター",
    desc: "1問ずつ進みながら定量目標を設定し、最終レポート生成まで体験できるウィザードUIデモ。",
    tags: ["デモ", "定量目標", "ウィザードUI"],
    status: "公開中",
  },
  {
    id: "qualitative-goal-navigator-demo",
    href: "/demo/qualitative-goal-navigator",
    label: "QUAL",
    color: "from-blue-500 to-indigo-500",
    title: "定性目標設定ナビゲーター",
    desc: "PDF準拠の固定選択項目で定性目標と行動3つを設定し、最終レポート生成まで行うデモ画面。",
    tags: ["デモ", "定性目標", "PDF準拠"],
    status: "公開中",
  },
  {
    id: "employees",
    href: "/employees",
    label: "EMP",
    color: "from-emerald-500 to-blue-500",
    title: "スタッフ管理",
    desc: "スタッフの一覧・詳細・登録と認証・権限管理。",
    tags: ["スタッフ", "認証", "権限"],
    status: "公開中",
  },
  {
    id: "tasks",
    href: "/tasks",
    label: "TASK",
    color: "from-amber-400 to-orange-500",
    title: "タスク管理",
    desc: "タスクの一覧・詳細・登録・スレッド管理。",
    tags: ["タスク", "スレッド"],
    status: "公開中",
  },
  {
    id: "docs",
    href: "/docs",
    label: "DOCS",
    color: "from-gray-500 to-gray-700",
    title: "開発ドキュメント",
    desc: "技術構成・要件定義・開発ログ・DB設計などの資料一覧。",
    tags: ["要件定義", "技術資料"],
    status: "公開中",
  },
];

const statusStyle: Record<Feature["status"], string> = {
  公開中: "bg-emerald-100 text-emerald-700",
  開発中: "bg-sky-100 text-sky-700",
  準備中: "bg-gray-100 text-gray-400",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav currentLabel="機能一覧" />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">機能一覧</h1>
          <p className="text-sm text-gray-500 mt-1">作成していく機能の一覧です。カードを選択すると各機能の画面へ移動します。</p>
        </div>

        <div className="space-y-3">
          {features.map((feature) => {
            const card = (
              <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${feature.href ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-50"}`}>
                <div className={`h-1 bg-gradient-to-r ${feature.color}`} />
                <div className="flex items-center gap-5 p-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-black font-mono tracking-tight">{feature.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-800">{feature.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {feature.tags.map((t) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusStyle[feature.status]}`}>
                      {feature.status}
                    </span>
                  </div>
                </div>
              </div>
            );

            return feature.href ? (
              <Link key={feature.id} href={feature.href}>{card}</Link>
            ) : (
              <div key={feature.id}>{card}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
