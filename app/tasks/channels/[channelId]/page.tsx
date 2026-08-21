"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import MemberPicker from "@/components/tasks/MemberPicker";
import AddMembersModal from "@/components/tasks/AddMembersModal";
import { getClientSession, isAdminSession, sessionMemberId, type SessionInfo } from "@/lib/clientSession";

type ChannelMember = { id: string; name: string; role: "admin" | "member"; joinedAt: string };
type Channel = { id: string; name: string; description?: string; members: ChannelMember[]; createdAt: string; updatedAt: string };
type TalkMember = { id: string; name: string; joinedAt: string };
type Talk = { id: string; channelId: string; name: string; description?: string; members: TalkMember[]; updatedAt: string };

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChannelDetailPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = use(params);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"talks" | "members">("talks");
  const [showTalkModal, setShowTalkModal] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const isAdmin = isAdminSession(session);
  const meId = sessionMemberId(session);
  const isMember = !!channel && channel.members.some((m) => m.id === meId);
  const canCreateTalk = isAdmin || isMember;

  const load = () => {
    fetch(`/api/task-channels/${channelId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setChannel(d.channel);
        setTalks(d.talks ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSession(getClientSession());
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const removeChannelMember = async (id: string) => {
    if (!confirm("このメンバーをチャンネルから削除しますか？")) return;
    const res = await fetch(`/api/task-channels/${channelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMemberId: id }),
    });
    const d = await res.json();
    if (res.ok) setChannel(d.channel);
    else alert(d?.error ?? "削除に失敗しました");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>
    );
  }
  if (notFound || !channel) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">チャンネルが見つかりません</p>
        <Link href="/tasks/channels" className="text-emerald-600 text-sm font-bold hover:underline">チャンネル一覧へ</Link>
      </div>
    );
  }

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
          <Link href="/tasks/channels" className="text-gray-500 text-sm hover:text-emerald-600 transition">チャンネル</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* チャンネルヘッダー */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg font-black flex-shrink-0">
            {channel.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-gray-800 truncate">{channel.name}</h1>
            {channel.description && <p className="text-sm text-gray-500 mt-0.5">{channel.description}</p>}
            <p className="text-xs text-gray-400 mt-1">メンバー {channel.members.length}名 ・ トーク {talks.length}件</p>
          </div>
        </div>

        {/* タブ */}
        <div className="flex border-b">
          {(["talks", "members"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === t ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              {t === "talks" ? "トーク" : "メンバー"}
            </button>
          ))}
        </div>

        {tab === "talks" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700">トーク一覧</span>
              {canCreateTalk ? (
                <button
                  onClick={() => setShowTalkModal(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
                >
                  + 新規トーク
                </button>
              ) : (
                <span className="text-xs text-gray-400">トーク作成は参加メンバーのみ</span>
              )}
            </div>

            {talks.length === 0 ? (
              <div className="text-center py-14 text-gray-400 bg-white rounded-2xl border border-dashed">
                <p className="text-base font-bold">トークがありません</p>
                {canCreateTalk && <p className="text-sm mt-1">「+ 新規トーク」から作成してください</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {talks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tasks/channels/${channelId}/talks/${t.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 px-4 py-3 hover:shadow-md hover:border-emerald-200 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-lg font-bold flex-shrink-0">#</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-700 transition">{t.name}</p>
                        {t.description && <p className="text-xs text-gray-400 truncate">{t.description}</p>}
                        <p className="text-[11px] text-gray-400 mt-0.5">招待 {t.members.length}名 ・ 最終更新 {fmt(t.updatedAt)}</p>
                      </div>
                      <span className="text-gray-300 group-hover:text-emerald-500 transition text-sm self-center">›</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ChannelMembers
            channel={channel}
            isAdmin={isAdmin}
            onRemove={removeChannelMember}
            onAdded={(c) => setChannel(c)}
          />
        )}
      </main>

      {showTalkModal && (
        <CreateTalkModal
          channelId={channelId}
          candidates={channel.members.map((m) => ({ id: m.id, name: m.name }))}
          meId={meId}
          onClose={() => setShowTalkModal(false)}
          onCreated={(talk) => {
            setShowTalkModal(false);
            setTalks((prev) => [talk, ...prev]);
          }}
        />
      )}
    </div>
  );
}

function ChannelMembers({
  channel,
  isAdmin,
  onRemove,
  onAdded,
}: {
  channel: Channel;
  isAdmin: boolean;
  onRemove: (id: string) => void;
  onAdded: (c: Channel) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-700">チャンネル参加メンバー</span>
        {isAdmin ? (
          <button
            onClick={() => setShowAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition"
          >
            + メンバー追加
          </button>
        ) : (
          <span className="text-xs text-gray-400">メンバー管理は管理者のみ</span>
        )}
      </div>
      {channel.members.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center bg-white rounded-2xl border border-dashed">メンバーがいません</p>
      ) : (
        <div className="bg-white rounded-2xl border divide-y">
          {channel.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {m.name.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{m.name}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                {m.role === "admin" ? "管理者" : "メンバー"}
              </span>
              {isAdmin && m.role !== "admin" && (
                <button onClick={() => onRemove(m.id)} className="text-xs text-gray-300 hover:text-rose-500 transition px-1">削除</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddMembersModal
          title="チャンネルにメンバーを追加"
          existingIds={channel.members.map((m) => m.id)}
          onClose={() => setShowAdd(false)}
          onSubmit={async (picked) => {
            const addMembers = picked.map((p) => ({ id: p.id, name: p.name, role: "member" as const }));
            const res = await fetch(`/api/task-channels/${channel.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addMembers }),
            });
            const d = await res.json();
            if (res.ok) {
              onAdded(d.channel);
              setShowAdd(false);
            } else {
              alert(d?.error ?? "追加に失敗しました");
            }
          }}
        />
      )}
    </div>
  );
}

function CreateTalkModal({
  channelId,
  candidates,
  meId,
  onClose,
  onCreated,
}: {
  channelId: string;
  candidates: { id: string; name: string }[];
  meId: string;
  onClose: () => void;
  onCreated: (talk: Talk) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setError("トーク名を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const members = selected.map((id) => {
        const c = candidates.find((x) => x.id === id);
        return { id, name: c?.name ?? id };
      });
      const res = await fetch(`/api/task-channels/${channelId}/talks`, {
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
      onCreated(data.talk);
    } catch {
      setError("通信エラーが発生しました");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">新規トーク</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">トーク名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 甲府店"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">説明（任意）</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="トークの用途"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">招待するメンバー</label>
            <p className="text-[11px] text-gray-400 mb-1">作成者（あなた）は自動で参加します。チャンネル参加メンバーから選択できます。</p>
            <MemberPicker
              selectedIds={selected}
              onChange={setSelected}
              excludeIds={meId ? [meId] : []}
              candidates={candidates}
            />
          </div>
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">キャンセル</button>
          <button onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition disabled:opacity-60">
            {saving ? "作成中..." : "作成する"}
          </button>
        </div>
      </div>
    </div>
  );
}
