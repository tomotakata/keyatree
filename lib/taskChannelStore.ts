import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabaseServer";

/**
 * タスク管理のチャンネル / トークを Supabase Storage に JSON として永続化する。
 * スタッフ / 目標ナビと同じく DDL 不要のバケット方式。
 * env 未設定時はメモリ fallback（開発用）。
 *
 * 階層: チャンネル（管理者が作成）→ トーク（参加メンバーが作成）→ チャット/タスク（後日）
 */

const BUCKET = "task-channels";
const CHANNEL_PREFIX = "channels";
const TALK_PREFIX = "talks";
const MESSAGE_PREFIX = "messages";

export type ChannelMemberRole = "admin" | "member";

export type ChannelMember = {
  id: string;
  name: string;
  role: ChannelMemberRole;
  joinedAt: string;
};

export type Channel = {
  id: string;
  name: string;
  description?: string;
  members: ChannelMember[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};

export type TalkMember = {
  id: string;
  name: string;
  joinedAt: string;
};

export type Talk = {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  members: TalkMember[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
};

export type TalkMessageReaction = { emoji: string; userIds: string[] };

export type TalkMessage = {
  id: string;
  talkId: string;
  channelId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  reactions?: TalkMessageReaction[];
  // 投稿(トップレベル)の件名。返信では未使用
  subject?: string;
  // 返信の場合、親投稿のID（未指定＝トップレベル投稿）
  parentId?: string;
  // このメッセージから起票された依頼（タスク）へのリンク
  taskId?: string;
  taskTitle?: string;
  // 種別: 通常投稿 or システム（依頼起票の告知など）
  kind?: "message" | "system";
};

// 初期チャンネル（既存カテゴリと整合）
const DEFAULT_CHANNEL_NAMES = ["営業", "管理", "報告", "契約", "物件管理", "研修", "総務", "経営", "その他"];

// ---- In-memory fallback ----
type GlobalStore = {
  channels: Map<string, Channel>;
  talks: Map<string, Talk>;
  messages: Map<string, TalkMessage[]>;
  seeded: boolean;
};
const g = globalThis as unknown as { __keyatreeTaskChannelStore?: GlobalStore };
function memory(): GlobalStore {
  if (!g.__keyatreeTaskChannelStore) {
    g.__keyatreeTaskChannelStore = { channels: new Map(), talks: new Map(), messages: new Map(), seeded: false };
  }
  return g.__keyatreeTaskChannelStore;
}

// ---- Storage helpers ----
let bucketReady = false;
async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error && !/exist/i.test(error.message)) {
      throw new Error(`bucket作成に失敗: ${error.message}`);
    }
  }
  bucketReady = true;
}

function channelPath(id: string) {
  return `${CHANNEL_PREFIX}/${encodeURIComponent(id)}.json`;
}
function talkPath(id: string) {
  return `${TALK_PREFIX}/${encodeURIComponent(id)}.json`;
}
function messagePath(talkId: string) {
  return `${MESSAGE_PREFIX}/${encodeURIComponent(talkId)}.json`;
}

async function putJson(supabase: ReturnType<typeof getSupabaseAdmin>, path: string, value: unknown) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, JSON.stringify(value), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

async function getJson<T>(supabase: ReturnType<typeof getSupabaseAdmin>, path: string): Promise<T | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function listJson<T>(supabase: ReturnType<typeof getSupabaseAdmin>, prefix: string): Promise<T[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const files = data.filter((i) => i.name.endsWith(".json"));
  const results = (await Promise.all(
    files.map((i) => getJson<T>(supabase, `${prefix}/${i.name}`))
  )) as (T | null)[];
  return results.filter((r): r is T => r !== null);
}

function newId() {
  return (globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

// ---- Seed ----
export async function seedChannels(): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseEnabled()) {
    const m = memory();
    if (m.seeded || m.channels.size > 0) {
      m.seeded = true;
      return;
    }
    for (const name of DEFAULT_CHANNEL_NAMES) {
      const c: Channel = { id: newId(), name, members: [], createdAt: now, updatedAt: now };
      m.channels.set(c.id, c);
    }
    m.seeded = true;
    return;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const existing = await listJson<Channel>(supabase, CHANNEL_PREFIX);
  if (existing.length > 0) return;
  for (const name of DEFAULT_CHANNEL_NAMES) {
    const c: Channel = { id: newId(), name, members: [], createdAt: now, updatedAt: now };
    await putJson(supabase, channelPath(c.id), c);
  }
}

// ---- Channels ----
export async function listChannels(): Promise<Channel[]> {
  if (!isSupabaseEnabled()) {
    return Array.from(memory().channels.values())
      .filter((c) => !c.archived)
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const all = await listJson<Channel>(supabase, CHANNEL_PREFIX);
  return all.filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export async function getChannel(id: string): Promise<Channel | null> {
  if (!isSupabaseEnabled()) return memory().channels.get(id) ?? null;
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return getJson<Channel>(supabase, channelPath(id));
}

export async function saveChannel(channel: Channel): Promise<Channel> {
  const next = { ...channel, updatedAt: new Date().toISOString() };
  if (!isSupabaseEnabled()) {
    memory().channels.set(next.id, next);
    return next;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, channelPath(next.id), next);
  return next;
}

export async function createChannel(input: {
  name: string;
  description?: string;
  members: ChannelMember[];
  createdBy?: string;
}): Promise<Channel> {
  const now = new Date().toISOString();
  const channel: Channel = {
    id: newId(),
    name: input.name,
    description: input.description,
    members: input.members,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  if (!isSupabaseEnabled()) {
    memory().channels.set(channel.id, channel);
    return channel;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, channelPath(channel.id), channel);
  return channel;
}

export async function deleteChannel(id: string): Promise<void> {
  if (!isSupabaseEnabled()) {
    const m = memory();
    m.channels.delete(id);
    for (const [tid, t] of m.talks) {
      if (t.channelId === id) m.talks.delete(tid);
    }
    return;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const talks = await listTalks(id);
  const paths = [channelPath(id), ...talks.map((t) => talkPath(t.id))];
  await supabase.storage.from(BUCKET).remove(paths);
}

// ---- Talks ----
export async function listTalks(channelId: string): Promise<Talk[]> {
  if (!isSupabaseEnabled()) {
    return Array.from(memory().talks.values())
      .filter((t) => t.channelId === channelId && !t.archived)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const all = await listJson<Talk>(supabase, TALK_PREFIX);
  return all
    .filter((t) => t.channelId === channelId && !t.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTalk(id: string): Promise<Talk | null> {
  if (!isSupabaseEnabled()) return memory().talks.get(id) ?? null;
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return getJson<Talk>(supabase, talkPath(id));
}

export async function saveTalk(talk: Talk): Promise<Talk> {
  const next = { ...talk, updatedAt: new Date().toISOString() };
  if (!isSupabaseEnabled()) {
    memory().talks.set(next.id, next);
    return next;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, talkPath(next.id), next);
  return next;
}

export async function createTalk(input: {
  channelId: string;
  name: string;
  description?: string;
  members: TalkMember[];
  createdBy?: string;
}): Promise<Talk> {
  const now = new Date().toISOString();
  const talk: Talk = {
    id: newId(),
    channelId: input.channelId,
    name: input.name,
    description: input.description,
    members: input.members,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  if (!isSupabaseEnabled()) {
    memory().talks.set(talk.id, talk);
    return talk;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, talkPath(talk.id), talk);
  return talk;
}

export async function deleteTalk(id: string): Promise<void> {
  if (!isSupabaseEnabled()) {
    memory().talks.delete(id);
    memory().messages.delete(id);
    return;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await supabase.storage.from(BUCKET).remove([talkPath(id), messagePath(id)]);
}

// ---- Talk messages (chat) ----
export async function listTalkMessages(talkId: string): Promise<TalkMessage[]> {
  if (!isSupabaseEnabled()) {
    return [...(memory().messages.get(talkId) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const list = (await getJson<TalkMessage[]>(supabase, messagePath(talkId))) ?? [];
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addTalkMessage(input: {
  talkId: string;
  channelId: string;
  authorId: string;
  authorName: string;
  text: string;
  subject?: string;
  parentId?: string;
  taskId?: string;
  taskTitle?: string;
  kind?: "message" | "system";
}): Promise<TalkMessage> {
  const now = new Date().toISOString();
  const msg: TalkMessage = {
    id: newId(),
    talkId: input.talkId,
    channelId: input.channelId,
    authorId: input.authorId,
    authorName: input.authorName,
    text: input.text,
    createdAt: now,
    reactions: [],
    subject: input.subject,
    parentId: input.parentId,
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    kind: input.kind ?? "message",
  };
  if (!isSupabaseEnabled()) {
    const m = memory();
    const arr = m.messages.get(input.talkId) ?? [];
    arr.push(msg);
    m.messages.set(input.talkId, arr);
    return msg;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const list = (await getJson<TalkMessage[]>(supabase, messagePath(input.talkId))) ?? [];
  list.push(msg);
  await putJson(supabase, messagePath(input.talkId), list);
  return msg;
}

export async function deleteTalkMessage(talkId: string, messageId: string): Promise<void> {
  if (!isSupabaseEnabled()) {
    const m = memory();
    m.messages.set(talkId, (m.messages.get(talkId) ?? []).filter((x) => x.id !== messageId));
    return;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const list = (await getJson<TalkMessage[]>(supabase, messagePath(talkId))) ?? [];
  await putJson(supabase, messagePath(talkId), list.filter((x) => x.id !== messageId));
}

export async function toggleTalkReaction(
  talkId: string,
  messageId: string,
  emoji: string,
  userId: string
): Promise<TalkMessage[]> {
  const apply = (list: TalkMessage[]) =>
    list.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = m.reactions ? [...m.reactions] : [];
      const idx = reactions.findIndex((r) => r.emoji === emoji);
      if (idx === -1) {
        reactions.push({ emoji, userIds: [userId] });
      } else {
        const users = reactions[idx].userIds;
        reactions[idx] = users.includes(userId)
          ? { emoji, userIds: users.filter((u) => u !== userId) }
          : { emoji, userIds: [...users, userId] };
        if (reactions[idx].userIds.length === 0) reactions.splice(idx, 1);
      }
      return { ...m, reactions };
    });
  if (!isSupabaseEnabled()) {
    const m = memory();
    const next = apply(m.messages.get(talkId) ?? []);
    m.messages.set(talkId, next);
    return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const list = (await getJson<TalkMessage[]>(supabase, messagePath(talkId))) ?? [];
  const next = apply(list);
  await putJson(supabase, messagePath(talkId), next);
  return next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---- 権限ヘルパー ----
export function isChannelMember(channel: Channel | null, session: { id?: string; employeeId?: string } | null): boolean {
  if (!channel || !session) return false;
  const ids = [session.employeeId, session.id].filter(Boolean) as string[];
  return channel.members.some((m) => ids.includes(m.id));
}
