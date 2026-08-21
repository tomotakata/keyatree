import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import { getChannel, getTalk, isChannelMember, deleteTalkMessage } from "@/lib/taskChannelStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ channelId: string; talkId: string; messageId: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { channelId, talkId, messageId } = await ctx.params;
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const channel = await getChannel(channelId);
    const talk = await getTalk(talkId);
    if (!channel || !talk || talk.channelId !== channelId) {
      return NextResponse.json({ error: "トークルームが見つかりません" }, { status: 404 });
    }
    const isAdmin = session.permissionId === "admin";
    if (!isAdmin && !isChannelMember(channel, session)) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }
    await deleteTalkMessage(talkId, messageId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
