import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/goalNavigatorStore";
import { listTasks, createTask, seedTasks, type TaskFilter } from "@/lib/taskServerStore";
import type { TaskType, TaskPriority } from "@/lib/taskStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter: TaskFilter = {
      talkId: searchParams.get("talkId") || undefined,
      channelId: searchParams.get("channelId") || undefined,
      assigneeId: searchParams.get("assigneeId") || undefined,
      archived: searchParams.get("archived") === "1",
    };
    await seedTasks();
    const tasks = await listTasks(filter);
    return NextResponse.json({ tasks });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      deadline?: string;
      category?: string;
      type?: TaskType;
      priority?: TaskPriority;
      assignees?: { id: string; name: string }[];
      channelId?: string;
      talkId?: string;
      talkName?: string;
    };
    const title = (body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "タイトルを入力してください" }, { status: 400 });

    const ownerId = session.employeeId || session.id || "";
    const task = await createTask({
      title,
      description: body.description?.trim() || "",
      deadline: body.deadline || "",
      category: body.category || "その他",
      type: body.type ?? "org",
      priority: body.priority ?? "medium",
      ownerId,
      ownerName: session.name,
      assignees: body.assignees ?? [],
      channelId: body.channelId,
      talkId: body.talkId,
      talkName: body.talkName,
    });
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
