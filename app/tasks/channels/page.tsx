"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import MemberPicker from "@/components/tasks/MemberPicker";
import { MOCK_EMPLOYEES } from "@/lib/taskStore";
import { getClientSession, isAdminSession, type SessionInfo } from "@/lib/clientSession";
import { getHiddenIds, toggleHiddenId, getSortPref, setSortPref } from "@/lib/uiPrefs";

type ChannelSort = "name" | "created" | "members";

type ChannelMember = { id: string; name: string; role: "admin" | "member"; joinedAt: string };
type Channel = {
  id: string;
  name: string;
  description?: string;
  members: ChannelMember[];
  createdAt: string;
  updatedAt: string;
};

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function ChannelsPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sort, setSort] = useState<ChannelSort>("name");
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);

  const isAdmin = isAdminSession(session);

  const load = () => {
    setLoading(true);
    fetch("/api/task-channels")
      .then((r) => r.json())
      .then((d) => setChannels(d?.channels ?? []))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSession(getClientSession());
    setHidden(getHiddenIds("channels"));
    setSort(getSortPref("channels", "name") as ChannelSort);
    load();
  }, []);

  const changeSort = (s: ChannelSort) => {
    setSort(s);
    setSortPref("channels", s);
  };
  const toggleHide = (id: string) => setHidden(toggleHiddenId("channels", id));

  const sorted = [...channels].sort((a, b) => {
    if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
    if (sort === "members") return b.members.length - a.members.length;
    return a.name.localeCompare(b.name, "ja");
  });
  const visible = showHidden ? sorted : sorted.filter((c) => !hidden.includes(c.id));
  const hiddenCount = channels.filter((c) => hidden.includes(c.id)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton />
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/tasks" className="font-bold text-gray-800 text-sm hover:text-emerald-600 transition">タスク管理</Link>
          <span className="text-gray-300 mx-1">›</span>
          <span className="text-gray-700 text-sm font-medium">チャンネル</span>
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
              >
                + 新規チャンネル
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">チャンネル一覧</h1>
            <p className="text-sm text-gray-500 mt-0.5">チャンネルの中にトークを作成し、メンバーを管理できます。</p>
          </div>
          {!isAdmin && (
            <span className="text-xs text-gray-400">チャンネル作成は管理者のみ</span>
          )}
        </div>

        {channels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => changeSort(e.target.value as ChannelSort)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="name">並べ替え: 名前順（あ→ん）</option>
              <option value="created">並べ替え: 作成が新しい順</option>
              <option value="members">並べ替え: メンバーが多い順</option>
            </select>
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden((v) => !v)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                {showHidden ? "非表示を隠す" : `非表示を表示 (${hiddenCount})`}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 py-10 text-center">読み込み中...</p>
        ) : channels.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base font-bold">チャンネルがありません</p>
            {isAdmin && <p className="text-sm mt-1">「+ 新規チャンネル」から作成してください</p>}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">表示中のチャンネルはありません（すべて非表示）</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((c) => {
              const isHidden = hidden.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-200 transition ${isHidden ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <Link href={`/tasks/channels/${c.id}`} className="flex-1 min-w-0 group">
                      <p className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-700 transition">{c.name}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{c.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">メンバー {c.members.length}名</span>
                        <span className="text-xs text-gray-400">作成 {fmt(c.createdAt)}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => toggleHide(c.id)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition flex-shrink-0 self-start"
                    >
                      {isHidden ? "表示する" : "非表示にする"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateChannelModal
          session={session}
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setShowCreate(false);
            router.push(`/tasks/channels/${c.id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateChannelModal({
  session,
  onClose,
  onCreated,
}: {
  session: SessionInfo | null;
  onClose: () => void;
  onCreated: (c: Channel) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meId = session?.employeeId || session?.id || "";

  const submit = async () => {
    if (!name.trim()) {
      setError("チャンネル名を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const members = selected.map((id) => {
        const emp = MOCK_EMPLOYEES.find((e) => e.id === id);
        return { id, name: emp?.name ?? id, role: "member" as const };
      });
      const res = await fetch("/api/task-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), members }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "作成に失敗しました");
        setSaving(false);
        return;
      }
      onCreated(data.channel);
    } catch {
      setError("通信エラーが発生しました");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">新規チャンネル</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">チャンネル名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ネットアップ依頼"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">説明（任意）</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="チャンネルの用途"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">参加メンバー</label>
            <p className="text-[11px] text-gray-400 mb-1">作成者（あなた）は自動で管理者として参加します。</p>
            <MemberPicker
              selectedIds={selected}
              onChange={setSelected}
              excludeIds={meId ? [meId] : []}
              fallback={MOCK_EMPLOYEES}
            />
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">キャンセル</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:opacity-60"
          >
            {saving ? "作成中..." : "作成する"}
          </button>
        </div>
      </div>
    </div>
  );
}
