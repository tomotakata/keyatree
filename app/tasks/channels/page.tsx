"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import MemberPicker from "@/components/tasks/MemberPicker";
import AddMembersModal from "@/components/tasks/AddMembersModal";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { MOCK_EMPLOYEES, STATUS_CONFIG, formatDeadline, type FullTask } from "@/lib/taskStore";
import { apiListTasks } from "@/lib/taskClient";
import { reminderLevel, REMINDER_STYLE } from "@/lib/taskReminder";
import { getClientSession, isAdminSession, sessionMemberId, type SessionInfo } from "@/lib/clientSession";
import { getOrder, setOrder, applyManualOrder, moveInOrder, getHiddenIds, toggleHiddenId } from "@/lib/uiPrefs";

type ChannelMember = { id: string; name: string; role: "admin" | "member"; joinedAt: string };
type Channel = { id: string; name: string; description?: string; members: ChannelMember[]; createdAt: string; updatedAt: string };
type TalkMember = { id: string; name: string; joinedAt: string };
type Talk = { id: string; channelId: string; name: string; description?: string; members: TalkMember[]; updatedAt: string };

type Selection = { type: "channel"; channelId: string } | { type: "talk"; channelId: string; talkId: string } | null;

const ICON_COLORS = [
  "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-pink-500",
];
function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ICON_COLORS[h % ICON_COLORS.length];
}

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function ChannelsWorkspacePage() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [talksByChannel, setTalksByChannel] = useState<Record<string, Talk[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Selection>(null);
  const [search, setSearch] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [talkModalChannel, setTalkModalChannel] = useState<Channel | null>(null);

  // 並べ替え / 非表示
  const [channelOrder, setChannelOrder] = useState<string[]>([]);
  const [hiddenChannels, setHiddenChannels] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [dragChannel, setDragChannel] = useState<string | null>(null);
  const [dragOverChannel, setDragOverChannel] = useState<string | null>(null);
  const [dragTalk, setDragTalk] = useState<{ channelId: string; talkId: string } | null>(null);
  const [dragOverTalk, setDragOverTalk] = useState<string | null>(null);

  // サイドバーからのリネーム
  const [renameChannelId, setRenameChannelId] = useState<string | null>(null);
  const [renameTalkId, setRenameTalkId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const isAdmin = isAdminSession(session);
  const meId = sessionMemberId(session);

  const startRenameChannel = (c: Channel) => {
    setRenameTalkId(null);
    setRenameChannelId(c.id);
    setRenameValue(c.name);
  };
  const startRenameTalk = (t: Talk) => {
    setRenameChannelId(null);
    setRenameTalkId(t.id);
    setRenameValue(t.name);
  };
  const cancelRename = () => {
    setRenameChannelId(null);
    setRenameTalkId(null);
    setRenameValue("");
  };
  const submitRenameChannel = async (c: Channel) => {
    const name = renameValue.trim();
    if (!name || name === c.name) return cancelRename();
    setRenameSaving(true);
    try {
      const res = await fetch(`/api/task-channels/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok) {
        setChannels((prev) => prev.map((x) => (x.id === c.id ? d.channel : x)));
        cancelRename();
      } else alert(d?.error ?? "名称変更に失敗しました");
    } finally {
      setRenameSaving(false);
    }
  };
  const submitRenameTalk = async (channelId: string, t: Talk) => {
    const name = renameValue.trim();
    if (!name || name === t.name) return cancelRename();
    setRenameSaving(true);
    try {
      const res = await fetch(`/api/task-channels/${channelId}/talks/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok) {
        setTalksByChannel((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] ?? []).map((x) => (x.id === t.id ? d.talk : x)),
        }));
        cancelRename();
      } else alert(d?.error ?? "名称変更に失敗しました");
    } finally {
      setRenameSaving(false);
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/task-channels")
      .then((r) => r.json())
      .then((d) => setChannels(d?.channels ?? []))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSession(getClientSession());
    setChannelOrder(getOrder("channels"));
    setHiddenChannels(getHiddenIds("channels"));
    load();
  }, [load]);

  const loadChannel = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/task-channels/${id}`);
      if (!res.ok) return;
      const d = await res.json();
      setTalksByChannel((prev) => ({ ...prev, [id]: d.talks ?? [] }));
      if (d.channel) setChannels((prev) => prev.map((c) => (c.id === id ? d.channel : c)));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!talksByChannel[id]) loadChannel(id);
      }
      return next;
    });
  };

  const selectChannel = (id: string) => {
    setSelection({ type: "channel", channelId: id });
    if (!talksByChannel[id]) loadChannel(id);
    setExpanded((prev) => new Set(prev).add(id));
  };
  const selectTalk = (channelId: string, talkId: string) => {
    setSelection({ type: "talk", channelId, talkId });
  };

  // ---- 並べ替え・表示制御 ----
  const orderedChannels = applyManualOrder(channels, channelOrder);
  const q = search.trim().toLowerCase();
  const filteredChannels = orderedChannels.filter((c) => {
    if (!showHidden && hiddenChannels.includes(c.id)) return false;
    if (!q) return true;
    if (c.name.toLowerCase().includes(q)) return true;
    return (talksByChannel[c.id] ?? []).some((t) => t.name.toLowerCase().includes(q));
  });
  const hiddenCount = channels.filter((c) => hiddenChannels.includes(c.id)).length;

  const dropChannel = (targetId: string) => {
    if (!dragChannel || dragChannel === targetId) {
      setDragChannel(null);
      setDragOverChannel(null);
      return;
    }
    const moved = moveInOrder(orderedChannels.map((c) => c.id), dragChannel, targetId);
    setChannelOrder(moved);
    setOrder("channels", moved);
    setDragChannel(null);
    setDragOverChannel(null);
  };

  const orderedTalks = (channelId: string) => {
    const talks = talksByChannel[channelId] ?? [];
    return applyManualOrder(talks, getOrder(`talks_${channelId}`));
  };
  const dropTalk = (channelId: string, targetTalkId: string) => {
    if (!dragTalk || dragTalk.channelId !== channelId || dragTalk.talkId === targetTalkId) {
      setDragTalk(null);
      setDragOverTalk(null);
      return;
    }
    const ids = orderedTalks(channelId).map((t) => t.id);
    const moved = moveInOrder(ids, dragTalk.talkId, targetTalkId);
    setOrder(`talks_${channelId}`, moved);
    setTalksByChannel((prev) => ({ ...prev })); // trigger re-render
    setDragTalk(null);
    setDragOverTalk(null);
  };

  const toggleHideChannel = (id: string) => setHiddenChannels(toggleHiddenId("channels", id));

  const selectedChannel = selection ? channels.find((c) => c.id === selection.channelId) ?? null : null;
  const selectedTalk =
    selection?.type === "talk"
      ? (talksByChannel[selection.channelId] ?? []).find((t) => t.id === selection.talkId) ?? null
      : null;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-200">
      {/* 上部バー */}
      <header className="h-12 flex items-center gap-3 px-4 bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        <Link href="/tasks" className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 transition">
          <span className="text-base leading-none">‹</span> タスク管理へ戻る
        </Link>
        <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center ml-2">
          <span className="text-white text-[11px] font-bold">K</span>
        </div>
        <span className="text-sm font-bold text-white">チャット</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/features" className="text-zinc-400 hover:text-white text-xs transition">機能一覧</Link>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* 左サイドバー */}
        <aside className="w-80 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col min-h-0">
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">チャット</h2>
            {isAdmin && (
              <button
                onClick={() => setShowCreateChannel(true)}
                title="新規チャンネル"
                className="w-7 h-7 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-lg leading-none flex items-center justify-center transition"
              >
                +
              </button>
            )}
          </div>

          {/* 検索 */}
          <div className="px-3 pb-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="チャンネル・トークルームを検索"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* フィルターチップ */}
          <div className="px-3 pb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-600 text-white">チャネル</span>
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowHidden((v) => !v)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
              >
                {showHidden ? "非表示を隠す" : `非表示 (${hiddenCount})`}
              </button>
            )}
          </div>

          <div className="px-3 pb-1 flex items-center gap-1.5 text-zinc-400">
            <span className="text-[11px] font-bold uppercase tracking-wide">Teams とチャネル</span>
          </div>

          {/* チャンネルツリー */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {loading ? (
              <p className="text-xs text-zinc-500 py-6 text-center">読み込み中...</p>
            ) : filteredChannels.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                {channels.length === 0 ? "チャンネルがありません" : "該当するチャンネルがありません"}
              </p>
            ) : (
              filteredChannels.map((c) => {
                const isOpen = expanded.has(c.id) || (!!q);
                const talks = orderedTalks(c.id);
                const isHidden = hiddenChannels.includes(c.id);
                const active = selection?.channelId === c.id && selection.type === "channel";
                return (
                  <div key={c.id} className={isHidden ? "opacity-50" : ""}>
                    <div
                      draggable
                      onDragStart={() => setDragChannel(c.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragChannel && dragOverChannel !== c.id) setDragOverChannel(c.id);
                      }}
                      onDragLeave={() => setDragOverChannel((cur) => (cur === c.id ? null : cur))}
                      onDrop={() => dropChannel(c.id)}
                      onDragEnd={() => {
                        setDragChannel(null);
                        setDragOverChannel(null);
                      }}
                      className={`group flex items-center gap-1 rounded-lg px-1.5 py-1.5 cursor-pointer transition ${
                        active ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                      } ${dragOverChannel === c.id && dragChannel !== c.id ? "ring-1 ring-emerald-500" : ""} ${
                        dragChannel === c.id ? "opacity-40" : ""
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(c.id);
                        }}
                        className="w-4 text-zinc-500 hover:text-zinc-200 text-[10px] flex-shrink-0"
                        title={isOpen ? "折りたたむ" : "展開"}
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                      <span className={`w-6 h-6 rounded ${colorFor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {c.name.charAt(0)}
                      </span>
                      {renameChannelId === c.id ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") submitRenameChannel(c);
                            if (e.key === "Escape") cancelRename();
                          }}
                          onBlur={() => submitRenameChannel(c)}
                          disabled={renameSaving}
                          className="flex-1 min-w-0 bg-zinc-900 border border-emerald-500 rounded px-1.5 py-0.5 text-sm text-white focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => selectChannel(c.id)}
                          onDoubleClick={(e) => {
                            if (!isAdmin) return;
                            e.stopPropagation();
                            startRenameChannel(c);
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <span className={`text-sm truncate block ${active ? "text-white font-semibold" : "text-zinc-200"}`}>{c.name}</span>
                        </button>
                      )}
                      <span className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition">
                        {isAdmin && renameChannelId !== c.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRenameChannel(c);
                            }}
                            title="名前を変更"
                            className="text-zinc-500 hover:text-emerald-400 text-xs px-1"
                          >
                            ✎
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHideChannel(c.id);
                          }}
                          title={isHidden ? "表示する" : "非表示にする"}
                          className="text-zinc-500 hover:text-zinc-200 text-xs px-1"
                        >
                          {isHidden ? "◎" : "⦸"}
                        </button>
                        <span className="text-zinc-600 cursor-grab active:cursor-grabbing text-xs px-0.5" title="ドラッグで並べ替え">⠿</span>
                      </span>
                    </div>

                    {/* トークルーム */}
                    {isOpen && (
                      <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
                        {(talksByChannel[c.id] === undefined) ? (
                          <p className="text-[11px] text-zinc-600 px-2 py-1">読み込み中...</p>
                        ) : talks.length === 0 ? (
                          <p className="text-[11px] text-zinc-600 px-2 py-1">トークルームなし</p>
                        ) : (
                          talks
                            .filter((t) => !q || t.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
                            .map((t) => {
                              const tActive = selection?.type === "talk" && selection.talkId === t.id;
                              const canRenameTalk = isAdmin || c.members.some((m) => m.id === meId);
                              return (
                                <div
                                  key={t.id}
                                  draggable
                                  onDragStart={() => setDragTalk({ channelId: c.id, talkId: t.id })}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (dragTalk?.channelId === c.id && dragOverTalk !== t.id) setDragOverTalk(t.id);
                                  }}
                                  onDragLeave={() => setDragOverTalk((cur) => (cur === t.id ? null : cur))}
                                  onDrop={() => dropTalk(c.id, t.id)}
                                  onDragEnd={() => {
                                    setDragTalk(null);
                                    setDragOverTalk(null);
                                  }}
                                  onClick={() => { if (renameTalkId !== t.id) selectTalk(c.id, t.id); }}
                                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer transition group/talk ${
                                    tActive ? "bg-emerald-600/20 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                                  } ${dragOverTalk === t.id && dragTalk?.talkId !== t.id ? "ring-1 ring-emerald-500" : ""} ${
                                    dragTalk?.talkId === t.id ? "opacity-40" : ""
                                  }`}
                                >
                                  <span className="text-zinc-500 text-xs flex-shrink-0">#</span>
                                  {renameTalkId === t.id ? (
                                    <input
                                      autoFocus
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") submitRenameTalk(c.id, t);
                                        if (e.key === "Escape") cancelRename();
                                      }}
                                      onBlur={() => submitRenameTalk(c.id, t)}
                                      disabled={renameSaving}
                                      className="flex-1 min-w-0 bg-zinc-900 border border-emerald-500 rounded px-1.5 py-0.5 text-[13px] text-white focus:outline-none"
                                    />
                                  ) : (
                                    <span
                                      className="text-[13px] truncate flex-1"
                                      onDoubleClick={(e) => {
                                        if (!canRenameTalk) return;
                                        e.stopPropagation();
                                        startRenameTalk(t);
                                      }}
                                    >
                                      {t.name}
                                    </span>
                                  )}
                                  {canRenameTalk && renameTalkId !== t.id && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startRenameTalk(t);
                                      }}
                                      title="名前を変更"
                                      className="opacity-0 group-hover/talk:opacity-100 text-zinc-500 hover:text-emerald-400 text-[11px] transition px-0.5"
                                    >
                                      ✎
                                    </button>
                                  )}
                                  <span className="opacity-0 group-hover/talk:opacity-100 text-zinc-600 cursor-grab active:cursor-grabbing text-[11px] transition" title="ドラッグで並べ替え">⠿</span>
                                </div>
                              );
                            })
                        )}
                        <TalkCreateInline
                          channel={c}
                          canCreate={isAdmin || c.members.some((m) => m.id === meId)}
                          onClick={() => setTalkModalChannel(c)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t border-zinc-800">
            <span className="text-[11px] text-zinc-500">ドラッグで並べ替え・チャンネルは管理者が作成</span>
          </div>
        </aside>

        {/* 右メインペイン */}
        <main className="flex-1 min-w-0 bg-zinc-900 flex flex-col min-h-0">
          {!selection ? (
            <EmptyState isAdmin={isAdmin} onCreate={() => setShowCreateChannel(true)} />
          ) : selection.type === "talk" && selectedTalk && selectedChannel ? (
            <TalkView
              key={selectedTalk.id}
              channel={selectedChannel}
              talk={selectedTalk}
              canManage={isAdmin || selectedChannel.members.some((m) => m.id === meId)}
              meId={meId}
              onTalkUpdated={(t) =>
                setTalksByChannel((prev) => ({
                  ...prev,
                  [t.channelId]: (prev[t.channelId] ?? []).map((x) => (x.id === t.id ? t : x)),
                }))
              }
            />
          ) : selection.type === "channel" && selectedChannel ? (
            <ChannelView
              key={selectedChannel.id}
              channel={selectedChannel}
              talks={talksByChannel[selectedChannel.id] ?? []}
              isAdmin={isAdmin}
              canCreateTalk={isAdmin || selectedChannel.members.some((m) => m.id === meId)}
              onOpenTalk={(talkId) => selectTalk(selectedChannel.id, talkId)}
              onCreateTalk={() => setTalkModalChannel(selectedChannel)}
              onChannelUpdated={(c) => setChannels((prev) => prev.map((x) => (x.id === c.id ? c : x)))}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">読み込み中...</div>
          )}
        </main>
      </div>

      {showCreateChannel && (
        <CreateChannelModal
          session={session}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(c) => {
            setShowCreateChannel(false);
            setChannels((prev) => [...prev, c]);
            selectChannel(c.id);
          }}
        />
      )}

      {talkModalChannel && (
        <CreateTalkModal
          channel={talkModalChannel}
          meId={meId}
          onClose={() => setTalkModalChannel(null)}
          onCreated={(talk) => {
            setTalksByChannel((prev) => ({
              ...prev,
              [talk.channelId]: [talk, ...(prev[talk.channelId] ?? [])],
            }));
            setExpanded((prev) => new Set(prev).add(talk.channelId));
            setTalkModalChannel(null);
            selectTalk(talk.channelId, talk.id);
          }}
        />
      )}
    </div>
  );
}

function TalkCreateInline({ channel, canCreate, onClick }: { channel: Channel; canCreate: boolean; onClick: () => void }) {
  if (!canCreate) return null;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800/60 transition"
    >
      <span className="text-sm">+</span> トークルームを追加
    </button>
  );
}

function EmptyState({ isAdmin, onCreate }: { isAdmin: boolean; onCreate: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl">💬</div>
      <p className="text-lg font-bold text-white">チャンネルまたはトークルームを選択</p>
      <p className="text-sm text-zinc-400 max-w-sm">左のリストからチャンネルを開き、トークルームを選ぶと内容が表示されます。</p>
      {isAdmin && (
        <button onClick={onCreate} className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
          + 新規チャンネルを作成
        </button>
      )}
    </div>
  );
}

/* ------------ トークルーム投稿ビュー（Teams風） ------------ */
function TalkView({
  channel,
  talk,
  canManage,
  meId,
  onTalkUpdated,
}: {
  channel: Channel;
  talk: Talk;
  canManage: boolean;
  meId: string;
  onTalkUpdated: (t: Talk) => void;
}) {
  const [tab, setTab] = useState<"posts" | "members">("posts");
  const [showAdd, setShowAdd] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [tasks, setTasks] = useState<FullTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(talk.name);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setTasksLoading(true);
    apiListTasks({ talkId: talk.id })
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, [talk.id]);

  useEffect(() => {
    setNameInput(talk.name);
    setEditingName(false);
  }, [talk.id, talk.name]);

  const saveName = async () => {
    const name = nameInput.trim();
    if (!name || name === talk.name) {
      setEditingName(false);
      setNameInput(talk.name);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/task-channels/${channel.id}/talks/${talk.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok) {
        onTalkUpdated(d.talk);
        setEditingName(false);
      } else alert(d?.error ?? "名称変更に失敗しました");
    } finally {
      setSavingName(false);
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm("このメンバーをトークルームから外しますか？")) return;
    const res = await fetch(`/api/task-channels/${channel.id}/talks/${talk.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMemberId: id }),
    });
    const d = await res.json();
    if (res.ok) onTalkUpdated(d.talk);
    else alert(d?.error ?? "削除に失敗しました");
  };

  // トークルームの参加メンバーを担当候補にする（自分も含める）
  const taskCandidates = talk.members.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ヘッダー */}
      <div className="flex-shrink-0 border-b border-zinc-800 px-5 pt-3">
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded ${colorFor(channel.id)} flex items-center justify-center text-white text-sm font-bold`}>
            {channel.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameInput(talk.name);
                    }
                  }}
                  className="bg-zinc-800 border border-emerald-500 rounded px-2 py-1 text-sm text-white w-56 focus:outline-none"
                />
                <button onClick={saveName} disabled={savingName} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-1 disabled:opacity-50">
                  {savingName ? "保存中" : "保存"}
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(talk.name); }} className="text-xs text-zinc-500 hover:text-zinc-300 px-1">
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white truncate">{talk.name}</h1>
                {canManage && (
                  <button
                    onClick={() => setEditingName(true)}
                    title="トークルーム名を変更"
                    className="text-zinc-500 hover:text-emerald-400 transition text-xs flex-shrink-0"
                  >
                    ✎
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] text-zinc-500 truncate">{channel.name} ・ 招待 {talk.members.length}名 ・ 依頼 {tasks.length}件</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {(["posts", "members"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
                tab === t ? "border-emerald-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "posts" ? "投稿（依頼・タスク）" : "メンバー"}
            </button>
          ))}
          <span className="px-3 py-2 text-sm text-zinc-600 cursor-default">共有済み</span>
          <span className="px-3 py-2 text-sm text-zinc-600 cursor-default">Notes</span>
        </div>
      </div>

      {tab === "posts" ? (
        <>
          {/* 依頼（タスク）一覧 */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="max-w-2xl mx-auto space-y-2">
              {tasksLoading ? (
                <p className="text-sm text-zinc-500 py-10 text-center">読み込み中...</p>
              ) : tasks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800 mx-auto flex items-center justify-center text-2xl mb-3">#</div>
                  <p className="text-base font-bold text-white">「{talk.name}」の依頼はまだありません</p>
                  <p className="text-sm text-zinc-400 mt-1">このトークルームで発生した依頼をタスクとして登録し、担当者に追いかけ（リマインド）を発生させましょう。</p>
                  {canManage && (
                    <button onClick={() => setShowCreateTask(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition">
                      + 依頼（タスク）を作成
                    </button>
                  )}
                </div>
              ) : (
                tasks.map((t) => {
                  const rem = reminderLevel(t);
                  const rs = REMINDER_STYLE[rem];
                  const cfg = STATUS_CONFIG[t.status];
                  return (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="block rounded-xl border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 px-4 py-3 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${t.status === "completed" ? "line-through text-zinc-500" : "text-zinc-100 group-hover:text-white"}`}>{t.title}</p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            期日 {formatDeadline(t.deadline)} ・ 担当 {t.members.filter((m) => m.role !== "owner").map((m) => m.name).join("、") || "未割当"}
                          </p>
                        </div>
                        {(rem === "overdue" || rem === "today" || rem === "soon") && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${rs.badge}`}>{rs.label}</span>
                        )}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-zinc-600 group-hover:text-emerald-400 transition flex-shrink-0">›</span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
          {/* 作成ボタン（コンポーザ位置） */}
          <div className="flex-shrink-0 border-t border-zinc-800 p-3">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                {canManage ? "依頼をタスク化すると、担当者のマイページ・タスク一覧に反映されます。" : "依頼の作成はチャンネル参加メンバーのみ可能です。"}
              </p>
              {canManage && (
                <button onClick={() => setShowCreateTask(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition flex-shrink-0">
                  + 依頼（タスク）を作成
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">招待メンバー</span>
              {canManage ? (
                <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition">
                  + メンバーを招待
                </button>
              ) : (
                <span className="text-xs text-zinc-500">招待はチャンネル参加メンバーのみ</span>
              )}
            </div>
            {talk.members.length === 0 ? (
              <p className="text-sm text-zinc-500 py-6 text-center bg-zinc-800/50 rounded-xl border border-dashed border-zinc-700">まだ招待メンバーがいません</p>
            ) : (
              <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
                {talk.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{m.name.charAt(0)}</span>
                    <p className="text-sm text-zinc-200 flex-1 min-w-0 truncate">{m.name}</p>
                    {canManage && (
                      <button onClick={() => removeMember(m.id)} className="text-xs text-zinc-500 hover:text-rose-400 transition px-1">外す</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateTask && (
        <CreateTaskModal
          channelId={channel.id}
          channelName={channel.name}
          talkId={talk.id}
          talkName={talk.name}
          candidates={taskCandidates.length > 0 ? taskCandidates : [{ id: meId, name: "自分" }]}
          onClose={() => setShowCreateTask(false)}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowCreateTask(false);
          }}
        />
      )}

      {showAdd && (
        <AddMembersModal
          title="トークルームにメンバーを招待"
          existingIds={talk.members.map((m) => m.id)}
          candidates={channel.members.map((m) => ({ id: m.id, name: m.name }))}
          onClose={() => setShowAdd(false)}
          onSubmit={async (picked) => {
            const res = await fetch(`/api/task-channels/${channel.id}/talks/${talk.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addMembers: picked }),
            });
            const d = await res.json();
            if (res.ok) {
              onTalkUpdated(d.talk);
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

/* ------------ チャンネル概要ビュー ------------ */
function ChannelView({
  channel,
  talks,
  isAdmin,
  canCreateTalk,
  onOpenTalk,
  onCreateTalk,
  onChannelUpdated,
}: {
  channel: Channel;
  talks: Talk[];
  isAdmin: boolean;
  canCreateTalk: boolean;
  onOpenTalk: (talkId: string) => void;
  onCreateTalk: () => void;
  onChannelUpdated: (c: Channel) => void;
}) {
  const [tab, setTab] = useState<"talks" | "members" | "analytics">("talks");
  const [showAdd, setShowAdd] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(channel.name);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setNameInput(channel.name);
    setEditingName(false);
  }, [channel.id, channel.name]);

  const saveName = async () => {
    const name = nameInput.trim();
    if (!name || name === channel.name) {
      setEditingName(false);
      setNameInput(channel.name);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/task-channels/${channel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (res.ok) {
        onChannelUpdated(d.channel);
        setEditingName(false);
      } else alert(d?.error ?? "名称変更に失敗しました");
    } finally {
      setSavingName(false);
    }
  };

  const removeChannelMember = async (id: string) => {
    if (!confirm("このメンバーをチャンネルから削除しますか？")) return;
    const res = await fetch(`/api/task-channels/${channel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeMemberId: id }),
    });
    const d = await res.json();
    if (res.ok) onChannelUpdated(d.channel);
    else alert(d?.error ?? "削除に失敗しました");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 border-b border-zinc-800 px-5 pt-3">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-lg ${colorFor(channel.id)} flex items-center justify-center text-white text-lg font-bold`}>
            {channel.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameInput(channel.name);
                    }
                  }}
                  className="bg-zinc-800 border border-emerald-500 rounded px-2 py-1 text-base text-white w-64 focus:outline-none"
                />
                <button onClick={saveName} disabled={savingName} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-1 disabled:opacity-50">
                  {savingName ? "保存中" : "保存"}
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(channel.name); }} className="text-xs text-zinc-500 hover:text-zinc-300 px-1">
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-bold text-white truncate">{channel.name}</h1>
                {isAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    title="チャンネル名を変更"
                    className="text-zinc-500 hover:text-emerald-400 transition text-sm flex-shrink-0"
                  >
                    ✎
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] text-zinc-500 truncate">
              {channel.description ? `${channel.description} ・ ` : ""}メンバー {channel.members.length}名 ・ トークルーム {talks.length}件
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          {(["talks", "members", "analytics"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
                tab === t ? "border-emerald-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "talks" ? "トークルーム" : t === "members" ? "メンバー" : "分析"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-3xl mx-auto">
          {tab === "talks" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">トークルーム一覧</span>
                {canCreateTalk && (
                  <button onClick={onCreateTalk} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition">
                    + 新規トークルーム
                  </button>
                )}
              </div>
              {talks.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 bg-zinc-800/40 rounded-xl border border-dashed border-zinc-700">
                  <p className="text-sm font-bold">トークルームがありません</p>
                  {canCreateTalk && <p className="text-xs mt-1">「+ 新規トークルーム」から作成してください</p>}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {talks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onOpenTalk(t.id)}
                      className="w-full flex items-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-800 px-4 py-3 text-left transition group"
                    >
                      <span className="text-zinc-500 text-lg font-bold flex-shrink-0">#</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-100 truncate group-hover:text-white">{t.name}</p>
                        {t.description && <p className="text-xs text-zinc-500 truncate">{t.description}</p>}
                        <p className="text-[11px] text-zinc-500 mt-0.5">招待 {t.members.length}名 ・ 最終更新 {fmt(t.updatedAt)}</p>
                      </div>
                      <span className="text-zinc-600 group-hover:text-emerald-400 transition">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "members" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">チャンネル参加メンバー</span>
                {isAdmin ? (
                  <button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition">
                    + メンバー追加
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500">メンバー管理は管理者のみ</span>
                )}
              </div>
              {channel.members.length === 0 ? (
                <p className="text-sm text-zinc-500 py-6 text-center bg-zinc-800/40 rounded-xl border border-dashed border-zinc-700">メンバーがいません</p>
              ) : (
                <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
                  {channel.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{m.name.charAt(0)}</span>
                      <p className="text-sm text-zinc-200 flex-1 min-w-0 truncate">{m.name}</p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${m.role === "admin" ? "bg-amber-500/20 text-amber-300" : "bg-zinc-700 text-zinc-300"}`}>
                        {m.role === "admin" ? "管理者" : "メンバー"}
                      </span>
                      {isAdmin && m.role !== "admin" && (
                        <button onClick={() => removeChannelMember(m.id)} className="text-xs text-zinc-500 hover:text-rose-400 transition px-1">削除</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ChannelAnalytics channel={channel} talks={talks} />
          )}
        </div>
      </div>

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
              onChannelUpdated(d.channel);
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

function ChannelAnalytics({ channel, talks }: { channel: Channel; talks: Talk[] }) {
  const activeUserIds = new Set<string>();
  channel.members.forEach((m) => activeUserIds.add(m.id));
  talks.forEach((t) => t.members.forEach((m) => activeUserIds.add(m.id)));
  const avgInvites = talks.length > 0 ? talks.reduce((s, t) => s + t.members.length, 0) / talks.length : 0;

  const talkBars = [...talks]
    .map((t) => ({ id: t.id, name: t.name, count: t.members.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const talkMax = Math.max(1, ...talkBars.map((b) => b.count));

  const cards = [
    { label: "アクティブユーザー", value: activeUserIds.size },
    { label: "チャンネルメンバー", value: channel.members.length },
    { label: "トークルーム数", value: talks.length },
    { label: "平均招待人数 / トークルーム", value: avgInvites.toFixed(1) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-4">
            <p className="text-2xl font-black text-white">{c.value}</p>
            <p className="text-xs font-bold text-zinc-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-5">
        <p className="text-sm font-bold text-white mb-3">トークルーム別 参加人数</p>
        {talkBars.length === 0 ? (
          <p className="text-xs text-zinc-500">トークルームがありません</p>
        ) : (
          <div className="space-y-2">
            {talkBars.map((b) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="text-xs text-zinc-400 w-28 truncate flex-shrink-0"># {b.name}</span>
                <div className="flex-1 bg-zinc-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full" style={{ width: `${(b.count / talkMax) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-zinc-200 w-10 text-right flex-shrink-0">{b.count}名</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-zinc-500">
        ※ 現在の分析は参加状況ベースです。投稿・返信などメッセージ活動の分析は、トークルーム内チャット機能の追加後に対応予定です。
      </p>
    </div>
  );
}

/* ------------ モーダル ------------ */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">説明（任意）</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="チャンネルの用途"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">参加メンバー</label>
            <p className="text-[11px] text-gray-400 mb-1">作成者（あなた）は自動で管理者として参加します。</p>
            <MemberPicker selectedIds={selected} onChange={setSelected} excludeIds={meId ? [meId] : []} fallback={MOCK_EMPLOYEES} />
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

function CreateTalkModal({
  channel,
  meId,
  onClose,
  onCreated,
}: {
  channel: Channel;
  meId: string;
  onClose: () => void;
  onCreated: (talk: Talk) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const candidates = channel.members.map((m) => ({ id: m.id, name: m.name }));

  const submit = async () => {
    if (!name.trim()) {
      setError("トークルーム名を入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const members = selected.map((id) => {
        const c = candidates.find((x) => x.id === id);
        return { id, name: c?.name ?? id };
      });
      const res = await fetch(`/api/task-channels/${channel.id}/talks`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-base">新規トークルーム（{channel.name}）</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">トークルーム名</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 甲府店"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">説明（任意）</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="トークルームの用途"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">招待するメンバー</label>
            <p className="text-[11px] text-gray-400 mb-1">作成者（あなた）は自動で参加します。チャンネル参加メンバーから選択できます。</p>
            <MemberPicker selectedIds={selected} onChange={setSelected} excludeIds={meId ? [meId] : []} candidates={candidates} />
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
