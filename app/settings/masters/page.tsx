"use client";

import { useState } from "react";
import Link from "next/link";

// ---- 初期マスターデータ ----
type MasterItem = { id: string; label: string; order: number };
type Masters = Record<string, MasterItem[]>;

const initialMasters: Masters = {
  department: [
    { id: "d1", label: "営業部 > 第一営業課", order: 1 },
    { id: "d2", label: "営業部 > 第二営業課", order: 2 },
    { id: "d3", label: "管理部 > 総務課", order: 3 },
    { id: "d4", label: "物件管理部 > 物件課", order: 4 },
    { id: "d5", label: "経営管理部", order: 5 },
  ],
  position: [
    { id: "p1", label: "代表取締役", order: 1 },
    { id: "p2", label: "部長", order: 2 },
    { id: "p3", label: "課長", order: 3 },
    { id: "p4", label: "主任", order: 4 },
    { id: "p5", label: "担当者", order: 5 },
  ],
  grade: [
    { id: "g1", label: "E1", order: 1 },
    { id: "g2", label: "E2", order: 2 },
    { id: "g3", label: "J1", order: 3 },
    { id: "g4", label: "J2", order: 4 },
    { id: "g5", label: "J3", order: 5 },
    { id: "g6", label: "S1", order: 6 },
    { id: "g7", label: "S2", order: 7 },
    { id: "g8", label: "S3", order: 8 },
    { id: "g9", label: "M1", order: 9 },
    { id: "g10", label: "M2", order: 10 },
    { id: "g11", label: "M3", order: 11 },
  ],
  jobType: [
    { id: "j1", label: "営業", order: 1 },
    { id: "j2", label: "管理", order: 2 },
    { id: "j3", label: "物件管理", order: 3 },
    { id: "j4", label: "経営", order: 4 },
    { id: "j5", label: "経理", order: 5 },
    { id: "j6", label: "マーケティング", order: 6 },
  ],
  employmentType: [
    { id: "e1", label: "正社員", order: 1 },
    { id: "e2", label: "契約社員", order: 2 },
    { id: "e3", label: "パートタイム", order: 3 },
    { id: "e4", label: "アルバイト", order: 4 },
  ],
};

const tabConfig = [
  { key: "department",    label: "部署",     desc: "従業員が所属する部署・課の一覧" },
  { key: "position",      label: "役職",     desc: "従業員の役職区分" },
  { key: "grade",         label: "等級",     desc: "給与・評価に紐づく等級区分" },
  { key: "jobType",       label: "職種",     desc: "業務内容に応じた職種区分" },
  { key: "employmentType",label: "雇用形態", desc: "契約の種別区分" },
];

// ---- 1行コンポーネント ----
function MasterRow({
  item,
  onEdit,
  onDelete,
}: {
  item: MasterItem;
  onEdit: (item: MasterItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition group">
      <span className="text-xs text-gray-300 font-mono w-5 text-right">{item.order}</span>
      <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(item)}
          className="text-xs text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg font-medium transition"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-xs text-rose-500 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg font-medium transition"
        >
          削除
        </button>
      </div>
    </div>
  );
}

// ---- 追加・編集モーダル ----
function EditModal({
  tabLabel,
  item,
  onClose,
  onSave,
}: {
  tabLabel: string;
  item: MasterItem | null;
  onClose: () => void;
  onSave: (label: string) => void;
}) {
  const [label, setLabel] = useState(item?.label ?? "");
  const isEdit = !!item;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-800 mb-4">
          {isEdit ? `${tabLabel}を編集` : `${tabLabel}を追加`}
        </h3>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">名称</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
          placeholder={`例：${tabLabel}名を入力`}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-5"
          onKeyDown={(e) => { if (e.key === "Enter" && label.trim()) onSave(label.trim()); }}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm border border-gray-200 rounded-xl py-2.5 text-gray-500 hover:bg-gray-50 transition">
            キャンセル
          </button>
          <button
            onClick={() => label.trim() && onSave(label.trim())}
            disabled={!label.trim()}
            className="flex-1 text-sm bg-emerald-500 text-white rounded-xl py-2.5 font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isEdit ? "保存する" : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- メインページ ----
export default function MastersPage() {
  const [masters, setMasters] = useState<Masters>(initialMasters);
  const [activeTab, setActiveTab] = useState("department");
  const [editTarget, setEditTarget] = useState<MasterItem | null | "new">(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentTab = tabConfig.find((t) => t.key === activeTab)!;
  const items = [...(masters[activeTab] ?? [])].sort((a, b) => a.order - b.order);

  const handleSave = (label: string) => {
    if (editTarget === "new") {
      const newItem: MasterItem = {
        id: `${activeTab}_${Date.now()}`,
        label,
        order: items.length + 1,
      };
      setMasters((m) => ({ ...m, [activeTab]: [...(m[activeTab] ?? []), newItem] }));
      showToast(`「${label}」を追加しました`);
    } else if (editTarget) {
      setMasters((m) => ({
        ...m,
        [activeTab]: m[activeTab].map((it) => it.id === editTarget.id ? { ...it, label } : it),
      }));
      showToast(`「${label}」に更新しました`);
    }
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!confirm(`「${target?.label}」を削除しますか？`)) return;
    setMasters((m) => ({
      ...m,
      [activeTab]: m[activeTab].filter((it) => it.id !== id).map((it, i) => ({ ...it, order: i + 1 })),
    }));
    showToast(`「${target?.label}」を削除しました`);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </Link>
            <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
            <span className="text-gray-300 mx-1">›</span>
            <span className="text-gray-700 text-sm font-medium">マスター管理</span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">マスター管理</h1>
            <p className="text-sm text-gray-500 mt-1">従業員登録フォームの選択肢を管理します。</p>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            {/* サイドタブ */}
            <aside className="md:w-44 flex-shrink-0">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {tabConfig.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full text-left px-4 py-3.5 text-sm font-medium border-b last:border-0 transition-colors flex items-center justify-between ${
                      activeTab === tab.key
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {masters[tab.key]?.length ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {/* コンテンツ */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {/* パネルヘッダー */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">{currentTab.label}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{currentTab.desc}</p>
                  </div>
                  <button
                    onClick={() => setEditTarget("new")}
                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg transition"
                  >
                    + 追加
                  </button>
                </div>

                {/* アイテムリスト */}
                <div className="divide-y">
                  {items.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      まだ登録されていません
                    </div>
                  ) : (
                    <div className="p-2">
                      {items.map((item) => (
                        <MasterRow
                          key={item.id}
                          item={item}
                          onEdit={(it) => setEditTarget(it)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* フッター */}
                {items.length > 0 && (
                  <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-400">
                    {items.length}件登録済み
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* モーダル */}
      {editTarget !== null && (
        <EditModal
          tabLabel={currentTab.label}
          item={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
