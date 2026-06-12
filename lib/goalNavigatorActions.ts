"use server";

import { revalidatePath } from "next/cache";
import { approveNavigatorRecord, canApprove, getServerSession, listNavigatorRecords, type NavigatorKind, type NavigatorRecord, upsertNavigatorRecord } from "@/lib/goalNavigatorStore";

export async function saveNavigatorRecord(input: {
  id?: string;
  kind: NavigatorKind;
  title: string;
  department: string;
  answers: Record<string, string>;
  status: "draft" | "submitted";
}) {
  const session = await getServerSession();
  if (!session) {
    return { ok: false as const, message: "ログイン情報を確認できませんでした" };
  }

  const employeeId = session.employeeId || input.answers.employeeId || "external";
  const ownerId = session.employeeId || session.id || input.answers.employeeId || input.answers.email || session.email;
  const employeeName = input.answers.name || session.name;

  const record = await upsertNavigatorRecord({
    id: input.id,
    ownerId,
    kind: input.kind,
    employeeId,
    employeeName,
    department: input.department,
    title: input.title,
    status: input.status,
    answers: input.answers,
    actor: {
      actorId: session.id || session.employeeId,
      actorName: session.name,
    },
  });

  revalidatePath("/goal-navigator");
  revalidatePath("/qualitative-goal-navigator");
  revalidatePath("/goal-navigator/history");
  revalidatePath("/qualitative-goal-navigator/history");
  revalidatePath("/approvals/goal-navigators");

  return { ok: true as const, record };
}

export async function approveNavigatorRecordAction(recordId: string) {
  const session = await getServerSession();
  if (!canApprove(session)) {
    return { ok: false as const, message: "承認権限がありません" };
  }

  const record = await approveNavigatorRecord(
    recordId,
    session?.name || "承認者",
    session?.id || session?.employeeId
  );
  if (!record) {
    return { ok: false as const, message: "対象レコードが見つかりません" };
  }

  revalidatePath("/approvals/goal-navigators");
  revalidatePath("/goal-navigator/history");
  revalidatePath("/qualitative-goal-navigator/history");

  return { ok: true as const, record };
}

export async function getMyNavigatorRecords(kind?: NavigatorKind): Promise<NavigatorRecord[]> {
  const session = await getServerSession();
  const ownerId = session?.employeeId || session?.id || session?.email;
  if (!ownerId) return [];
  return await listNavigatorRecords({ kind, ownerId, employeeId: session.employeeId });
}

export async function getApprovalNavigatorRecords(kind?: NavigatorKind): Promise<NavigatorRecord[]> {
  const session = await getServerSession();
  if (!canApprove(session)) return [];
  const records = await listNavigatorRecords({ kind, includeAll: true });
  return records.filter((record) => record.status !== "approved");
}

export async function getApprovedNavigatorRecords(kind?: NavigatorKind): Promise<NavigatorRecord[]> {
  const session = await getServerSession();
  if (!canApprove(session)) return [];
  const records = await listNavigatorRecords({ kind, includeAll: true });
  return records.filter((record) => record.status === "approved");
}