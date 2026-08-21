import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import {
  getChannel,
  getTalk,
  saveTalk,
  isChannelMember,
  listTalkMessages,
  addTalkMessage,
  toggleTalkReaction,
} from "@/lib/taskChannelStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ channelId: string; talkId: string }> };

async function authorize(channelId: string, talkId: string) {
  const session = await getServerSession();
  if (!session) return { error: "unauthorized", status: 401 as const };
  const channel = await getChannel(channelId);
  if (!channel) return { error: "チャンネルが見つかりません", status: 404 as const };
  const talk = await getTalk(talkId);
  if (!talk || talk.channelId !== channelId) {
    return { error: "トークルームが見つかりません", status: 404 as const };
  }
  const isAdmin = session.permissionId === "admin";
  if (!isAdmin && !isChannelMember(channel, session)) {
    return { error: "権限がありません", status: 403 as const };
  }
  return { session, channel, talk };
}

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { channelId, talkId } = await ctx.params;
    const channel = await getChannel(channelId);
    const talk = await getTalk(talkId);
    if (!channel || !talk || talk.channelId !== channelId) {
      return NextResponse.json({ error: "トークルームが見つかりません" }, { status: 404 });
    }
    const messages = await listTalkMessages(talkId);
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { channelId, talkId } = await ctx.params;
    const auth = await authorize(channelId, talkId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { session, talk } = auth;

    const body = (await request.json()) as {
      text?: string;
      subject?: string;
      parentId?: string;
      // リアクション操作
      reactionMessageId?: string;
      emoji?: string;
      // 依頼(タスク)起票の告知メッセージ用
      taskId?: string;
      taskTitle?: string;
      kind?: "message" | "system";
    };

    const authorId = session.employeeId ?? session.id ?? "";
    const authorName = session.name ?? "不明";

    // リアクション切り替え
    if (body.reactionMessageId && body.emoji) {
      const messages = await toggleTalkReaction(talkId, body.reactionMessageId, body.emoji, authorId);
      return NextResponse.json({ messages });
    }

    const text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "本文を入力してください" }, { status: 400 });

    const message = await addTalkMessage({
      talkId,
      channelId,
      authorId,
      authorName,
      text,
      subject: body.subject?.trim() || undefined,
      parentId: body.parentId,
      taskId: body.taskId,
      taskTitle: body.taskTitle,
      kind: body.kind ?? "message",
    });
    // トークルームの updatedAt を更新（一覧の並びに反映）
    await saveTalk(talk);
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
