import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import {
  getChannel,
  listTalks,
  createTalk,
  isChannelMember,
  type TalkMember,
} from "@/lib/taskChannelStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ channelId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { channelId } = await ctx.params;
    const talks = await listTalks(channelId);
    return NextResponse.json({ talks });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { channelId } = await ctx.params;
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const channel = await getChannel(channelId);
    if (!channel) return NextResponse.json({ error: "チャンネルが見つかりません" }, { status: 404 });

    const isAdmin = session.permissionId === "admin";
    if (!isAdmin && !isChannelMember(channel, session)) {
      return NextResponse.json(
        { error: "トークの作成はチャンネル参加メンバーのみ可能です" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      members?: { id: string; name: string }[];
    };
    const name = (body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "トーク名を入力してください" }, { status: 400 });

    const now = new Date().toISOString();
    const creatorId = session.employeeId || session.id || "";
    const members: TalkMember[] = [];
    if (creatorId) members.push({ id: creatorId, name: session.name, joinedAt: now });
    for (const m of body.members ?? []) {
      if (!m.id || members.some((x) => x.id === m.id)) continue;
      members.push({ id: m.id, name: m.name, joinedAt: now });
    }

    const talk = await createTalk({
      channelId,
      name,
      description: body.description?.trim() || undefined,
      members,
      createdBy: creatorId,
    });
    return NextResponse.json({ talk });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
