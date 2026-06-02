"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ViewRecord = {
  id: string;
  name: string;
  email: string;
  viewedAt: string;
  confirmed: boolean;
  confirmedAt?: string;
};

type Session = {
  name: string;
  email: string;
};

function parseCookieSession(): Session | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/kt_session=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ConfirmModal({
  defaultName,
  defaultEmail,
  onClose,
  onConfirm,
}: {
  defaultName: string;
  defaultEmail: string;
  onClose: () => void;
  onConfirm: (name: string, email: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5">
          <h3 className="text-white font-bold text-lg">読了確認</h3>
          <p className="text-emerald-100 text-xs mt-1">ドキュメントを最後まで確認した方は、お名前を入力して承認してください。</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">お名前 <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：鈴木 一郎"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">メールアドレス（任意）</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例：suzuki@keyaki-s.com"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-xs text-emerald-700 leading-relaxed">
              承認すると、閲覧済みとして記録されます。記録した日時・お名前は管理者が確認できます。
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm border border-gray-200 rounded-xl py-2.5 text-gray-500 hover:bg-gray-50 transition">キャンセル</button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim(), email.trim())}
            disabled={!name.trim()}
            className="flex-1 text-sm bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold rounded-xl py-2.5 transition"
          >
            読了を承認する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrackedDocPage({
  docId,
  docTitle,
  docSubtitle,
  docVersion,
  docDate,
  docTarget,
  docAuthor,
  iframeSrc,
  demoHref,
  demoLabel,
}: {
  docId: string;
  docTitle: string;
  docSubtitle: string;
  docVersion: string;
  docDate: string;
  docTarget: string;
  docAuthor: string;
  iframeSrc: string;
  demoHref?: string;
  demoLabel?: string;
}) {
  const session = typeof window !== "undefined" ? parseCookieSession() : null;
  const [records, setRecords] = useState<ViewRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [myRecord, setMyRecord] = useState<ViewRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAllViewers, setShowAllViewers] = useState(false);
  const hasTracked = useRef(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const stored: ViewRecord[] = JSON.parse(localStorage.getItem(`doc_${docId}`) ?? "[]");
    setRecords(stored);

    if (!hasTracked.current && session) {
      hasTracked.current = true;
      const existing = stored.find((r) => r.email === session.email);
      if (!existing) {
        const newRecord: ViewRecord = {
          id: `v_${Date.now()}`,
          name: session.name,
          email: session.email,
          viewedAt: new Date().toISOString(),
          confirmed: false,
        };
        const updated = [...stored, newRecord];
        localStorage.setItem(`doc_${docId}`, JSON.stringify(updated));
        setRecords(updated);
        setMyRecord(newRecord);
      } else {
        setMyRecord(existing);
      }
    }
  }, [docId, session]);

  const handleConfirm = (name: string, email: string) => {
    const now = new Date().toISOString();
    const updated = records.map((r) =>
      r.email === email || r.id === myRecord?.id
        ? { ...r, name, email, confirmed: true, confirmedAt: now }
        : r,
    );
    const exists = updated.some((r) => r.email === email || r.id === myRecord?.id);
    const final = exists
      ? updated
      : [...updated, { id: `v_${Date.now()}`, name, email, viewedAt: now, confirmed: true, confirmedAt: now }];
    localStorage.setItem(`doc_${docId}`, JSON.stringify(final));
    setRecords(final);
    setMyRecord(final.find((r) => r.email === email) ?? null);
    setShowModal(false);
    showToast(`${name} さんの読了確認を記録しました`);
  };

  const confirmedCount = records.filter((r) => r.confirmed).length;
  const viewCount = records.length;
  const isConfirmed = myRecord?.confirmed ?? false;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/employees" className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">K</span>
            </Link>
            <Link href="/employees" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">KeyaTree</Link>
            <span className="text-gray-300">›</span>
            <Link href="/docs" className="text-gray-500 text-sm hover:text-emerald-600 transition">開発ドキュメント</Link>
            <span className="text-gray-300">›</span>
            <span className="text-gray-700 text-sm font-medium truncate">{docTitle}</span>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
          <div className="flex-1 min-w-0">
            <iframe
              src={iframeSrc}
              className="w-full rounded-2xl border shadow-sm bg-white"
              style={{ height: "calc(100vh - 120px)", minHeight: 600 }}
              title={docTitle}
            />
          </div>

          <aside className="w-72 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                <h3 className="text-white font-bold text-sm">閲覧状況</h3>
                <p className="text-emerald-100 text-xs mt-0.5">{docSubtitle}</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-gray-800">{viewCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">閲覧者数</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-emerald-600">{confirmedCount}</p>
                  <p className="text-xs text-gray-400 mt-0.5">読了確認済み</p>
                </div>
              </div>
              {viewCount > 0 && (
                <div className="px-4 pb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>読了率</span>
                    <span>{Math.round((confirmedCount / viewCount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${viewCount > 0 ? (confirmedCount / viewCount) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4">
              {isConfirmed ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-800">読了確認済み</p>
                  <p className="text-xs text-gray-400 mt-1">{myRecord?.confirmedAt ? formatDate(myRecord.confirmedAt) : ""}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">{myRecord?.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800 mb-1">読了確認</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">ドキュメントを最後まで読んだら、承認ボタンを押してください。</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition shadow-sm"
                  >
                    読了を承認する
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                <h4 className="text-xs font-bold text-gray-700">閲覧者リスト</h4>
                {records.length > 3 && (
                  <button onClick={() => setShowAllViewers(!showAllViewers)} className="text-xs text-emerald-600 hover:underline font-medium">
                    {showAllViewers ? "閉じる" : `全${records.length}件`}
                  </button>
                )}
              </div>
              {records.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-gray-400">まだ閲覧記録がありません</div>
              ) : (
                <div className="divide-y">
                  {(showAllViewers ? records : records.slice(0, 3)).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${r.confirmed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{r.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.viewedAt)}</p>
                      </div>
                      {r.confirmed ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex-shrink-0">確認済</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">閲覧中</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 mb-3">ドキュメント情報</h4>
              {[
                { label: "バージョン", value: docVersion },
                { label: "作成日", value: docDate },
                { label: "対象", value: docTarget },
                { label: "作成者", value: docAuthor },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-xs gap-3">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-gray-700 font-medium text-right">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t mt-2 space-y-2">
                {demoHref && (
                  <Link
                    href={demoHref}
                    className="w-full flex items-center justify-center gap-2 text-xs text-white bg-emerald-500 rounded-lg py-2 hover:bg-emerald-600 transition font-bold"
                  >
                    {demoLabel ?? "デモを見る"}
                  </Link>
                )}
                <a href={iframeSrc} target="_blank" className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition">
                  新しいタブで開く
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showModal && (
        <ConfirmModal
          defaultName={session?.name ?? ""}
          defaultEmail={session?.email ?? ""}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
