import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import {
  getTask, updateTask, updateStatus, addMessage, deleteMessage,
  toggleReaction, addMember, removeMember, archiveTask, restoreTask, deleteTask,
} from "@/lib/taskServerStore";
import type { TaskMember, TaskEditInput, TaskStatus } from "@/lib/taskStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params;
    const task = await getTask(taskId);
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

type PatchBody = {
  action:
    | "edit" | "status" | "addMember" | "removeMember"
    | "addMessage" | "deleteMessage" | "reaction" | "archive" | "restore";
  edit?: TaskEditInput;
  status?: TaskStatus;
  member?: TaskMember;
  memberId?: string;
  message?: { subject: string; toIds: string[]; toNames: string[]; text: string; replyToId?: string };
  msgId?: string;
  emoji?: string;
};

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params;
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const meId = session.employeeId || session.id || "";

    const body = (await request.json()) as PatchBody;
    let task = null;
    switch (body.action) {
      case "edit":
        task = await updateTask(taskId, body.edit ?? {});
        break;
      case "status":
        if (!body.status) return NextResponse.json({ error: "status required" }, { status: 400 });
        task = await updateStatus(taskId, body.status);
        break;
      case "addMember":
        if (!body.member) return NextResponse.json({ error: "member required" }, { status: 400 });
        task = await addMember(taskId, body.member);
        break;
      case "removeMember":
        if (!body.memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });
        task = await removeMember(taskId, body.memberId);
        break;
      case "addMessage": {
        if (!body.message) return NextResponse.json({ error: "message required" }, { status: 400 });
        const senderId = body.message.subject === "__system__" ? "system" : meId;
        const senderName = senderId === "system" ? "システム" : session.name;
        task = await addMessage(taskId, {
          senderId,
          senderName,
          subject: body.message.subject === "__system__" ? "システム" : body.message.subject,
          toIds: body.message.toIds,
          toNames: body.message.toNames,
          text: body.message.text,
          replyToId: body.message.replyToId,
        });
        break;
      }
      case "deleteMessage":
        if (!body.msgId) return NextResponse.json({ error: "msgId required" }, { status: 400 });
        task = await deleteMessage(taskId, body.msgId);
        break;
      case "reaction":
        if (!body.msgId || !body.emoji) return NextResponse.json({ error: "msgId/emoji required" }, { status: 400 });
        task = await toggleReaction(taskId, body.msgId, body.emoji, meId);
        break;
      case "archive":
        task = await archiveTask(taskId);
        break;
      case "restore":
        task = await restoreTask(taskId);
        break;
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { taskId } = await ctx.params;
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const ok = await deleteTask(taskId);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
