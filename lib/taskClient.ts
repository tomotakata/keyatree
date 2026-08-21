"use client";

import type { FullTask, TaskMember, TaskEditInput, TaskStatus, TaskType, TaskPriority } from "@/lib/taskStore";

/** クライアントから /api/tasks を叩く薄いラッパー群。 */

export type ListParams = { talkId?: string; channelId?: string; assigneeId?: string; archived?: boolean };

export async function apiListTasks(params: ListParams = {}): Promise<FullTask[]> {
  const q = new URLSearchParams();
  if (params.talkId) q.set("talkId", params.talkId);
  if (params.channelId) q.set("channelId", params.channelId);
  if (params.assigneeId) q.set("assigneeId", params.assigneeId);
  if (params.archived) q.set("archived", "1");
  const res = await fetch(`/api/tasks?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const d = await res.json();
  return (d?.tasks ?? []) as FullTask[];
}

export async function apiGetTask(id: string): Promise<FullTask | null> {
  const res = await fetch(`/api/tasks/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const d = await res.json();
  return (d?.task ?? null) as FullTask | null;
}

export async function apiCreateTask(input: {
  title: string;
  description?: string;
  deadline?: string;
  category: string;
  type: TaskType;
  priority: TaskPriority;
  assignees?: { id: string; name: string }[];
  channelId?: string;
  talkId?: string;
  talkName?: string;
}): Promise<FullTask> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const d = await res.json();
  if (!res.ok) throw new Error(d?.error ?? "作成に失敗しました");
  return d.task as FullTask;
}

async function patch(id: string, body: Record<string, unknown>): Promise<FullTask | null> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return (d?.task ?? null) as FullTask | null;
}

export const apiEditTask = (id: string, edit: TaskEditInput) => patch(id, { action: "edit", edit });
export const apiSetStatus = (id: string, status: TaskStatus) => patch(id, { action: "status", status });
export const apiAddMember = (id: string, member: TaskMember) => patch(id, { action: "addMember", member });
export const apiRemoveMember = (id: string, memberId: string) => patch(id, { action: "removeMember", memberId });
export const apiAddMessage = (
  id: string,
  message: { subject: string; toIds: string[]; toNames: string[]; text: string; replyToId?: string },
) => patch(id, { action: "addMessage", message });
export const apiDeleteMessage = (id: string, msgId: string) => patch(id, { action: "deleteMessage", msgId });
export const apiToggleReaction = (id: string, msgId: string, emoji: string) =>
  patch(id, { action: "reaction", msgId, emoji });
export const apiArchiveTask = (id: string) => patch(id, { action: "archive" });
export const apiRestoreTask = (id: string) => patch(id, { action: "restore" });

export async function apiDeleteTask(id: string): Promise<boolean> {
  const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  return res.ok;
}
