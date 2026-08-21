"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import AddMembersModal from "@/components/tasks/AddMembersModal";
import { getClientSession, isAdminSession, sessionMemberId, type SessionInfo } from "@/lib/clientSession";

type ChannelMember = { id: string; name: string; role: "admin" | "member"; joinedAt: string };
type Channel = { id: string; name: string; members: ChannelMember[] };
type TalkMember = { id: string; name: string; joinedAt: string };
type Talk = { id: string; channelId: string; name: string; description?: string; members: TalkMember[]; updatedAt: string };

export default function TalkDetailPage({ params }: { params: Promise<{ channelId: string; talkId: string }> }) {
  const { channelId, talkId } = use(params);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const isAdmin = isAdminSession(session);
  const meId = sessionMemberId(session);
  const isChannelMember = !!channel && channel.members.some((m) => m.id === meId);
  const canManage = isAdmin || isChannelMember;

  useEffect(() => {
    setSession(getClientSession());
    fetch(`/api/task-channels/${channelId}/talks/${talkId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setChannel(d.channel);
        setTalk(d.talk);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [channelId, talkId]);

  const removeMember = async (id: string) => {
    if (!confirm("このメンバーをトークから外しますか？")) return;
    const res = await fetch(`/api/task-channels/${channelId}/talks/${talkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMemberId: id }),
    });
    const d = await res.json();
    if (res.ok) setTalk(d.talk);
    else alert(d?.error ?? "削除に失敗しました");
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">読み込み中...</div>;
  }
  if (notFound || !talk || !channel) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500">トークが見つかりません</p>
        <Link href={`/tasks/channels/${channelId}`} className="text-emerald-600 text-sm font-bold hover:underline">チャンネルへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <BackButton />
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">K</span>
          </div>
          <Link href="/tasks/channels" className="text-gray-500 text-sm hover:text-emerald-600 transition">チャンネル</Link>
          <span className="text-gray-300 mx-1">›</span>
          <Link href={`/tasks/channels/${channelId}`} className="text-gray-500 text-sm hover:text-emerald-600 transition truncate max-w-[120px]">{channel.name}</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="text-gray-400 text-2xl font-black flex-shrink-0">#</span>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-gray-800 truncate">{talk.name}</h1>
            {talk.description && <p className="text-sm text-gray-500 mt-0.5">{talk.description}</p>}
            <p className="text-xs text-gray-400 mt-1">{channel.name} ・ 招待 {talk.members.length}名</p>
          </div>
        </div>

        {/* 招待メンバー管理 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">招待メンバー</span>
            {canManage ? (
              <button onClick={() => setShowAdd(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition">
                + メンバーを招待
              </button>
            ) : (
              <span className="text-xs text-gray-400">招待はチャンネル参加メンバーのみ</span>
            )}
          </div>
          {talk.members.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center bg-white rounded-2xl border border-dashed">まだ招待メンバーがいません</p>
          ) : (
            <div className="bg-white rounded-2xl border divide-y">
              {talk.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{m.name.charAt(0)}</span>
                  <p className="text-sm text-gray-800 flex-1 min-w-0 truncate">{m.name}</p>
                  {canManage && (
                    <button onClick={() => removeMember(m.id)} className="text-xs text-gray-300 hover:text-rose-500 transition px-1">外す</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* チャット/タスク（次回追加予定） */}
        <div className="bg-white rounded-2xl border border-dashed p-6 text-center">
          <p className="text-sm font-bold text-gray-500">チャット / タスク</p>
          <p className="text-xs text-gray-400 mt-1">このトーク内のチャット・タスク機能は今後追加予定です。</p>
        </div>
      </main>

      {showAdd && (
        <AddMembersModal
          title="トークにメンバーを招待"
          existingIds={talk.members.map((m) => m.id)}
          candidates={channel.members.map((m) => ({ id: m.id, name: m.name }))}
          onClose={() => setShowAdd(false)}
          onSubmit={async (picked) => {
            const res = await fetch(`/api/task-channels/${channelId}/talks/${talkId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addMembers: picked }),
            });
            const d = await res.json();
            if (res.ok) {
              setTalk(d.talk);
              setShowAdd(false);
            } else {
              alert(d?.error ?? "招待に失敗しました");
            }
          }}
        />
      )}
    </div>
  );
}
