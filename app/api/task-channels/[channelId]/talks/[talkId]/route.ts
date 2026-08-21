import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import {
  getChannel,
  getTalk,
  saveTalk,
  deleteTalk,
  isChannelMember,
  type TalkMember,
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
    return { error: "トークが見つかりません", status: 404 as const };
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
      return NextResponse.json({ error: "トークが見つかりません" }, { status: 404 });
    }
    return NextResponse.json({ channel, talk });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { channelId, talkId } = await ctx.params;
    const auth = await authorize(channelId, talkId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { talk } = auth;

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      archived?: boolean;
      addMembers?: { id: string; name: string }[];
      removeMemberId?: string;
    };
    const now = new Date().toISOString();
    if (typeof body.name === "string" && body.name.trim()) talk.name = body.name.trim();
    if (typeof body.description === "string") talk.description = body.description.trim() || undefined;
    if (typeof body.archived === "boolean") talk.archived = body.archived;
    if (body.addMembers) {
      for (const m of body.addMembers) {
        if (!m.id || talk.members.some((x) => x.id === m.id)) continue;
        const member: TalkMember = { id: m.id, name: m.name, joinedAt: now };
        talk.members.push(member);
      }
    }
    if (body.removeMemberId) {
      talk.members = talk.members.filter((m) => m.id !== body.removeMemberId);
    }
    const saved = await saveTalk(talk);
    return NextResponse.json({ talk: saved });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { channelId, talkId } = await ctx.params;
    const auth = await authorize(channelId, talkId);
    if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
    await deleteTalk(talkId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
