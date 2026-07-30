"use server";

import { revalidatePath } from "next/cache";
import {
  addProgressUpdate,
  approveNavigatorRecord,
  canApprove,
  getNavigatorRecordById,
  getServerSession,
  listNavigatorRecords,
  rejectNavigatorRecord,
  type NavigatorKind,
  type NavigatorRecord,
  upsertNavigatorRecord,
} from "@/lib/goalNavigatorStore";

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

export async function approveNavigatorRecordAction(recordId: string, comment?: string) {
  const session = await getServerSession();
  if (!canApprove(session)) {
    return { ok: false as const, message: "承認権限がありません" };
  }

  const record = await approveNavigatorRecord(
    recordId,
    session?.name || "承認者",
    session?.id || session?.employeeId,
    comment
  );
  if (!record) {
    return { ok: false as const, message: "対象レコードが見つかりません" };
  }

  revalidatePath("/approvals/goal-navigators");
  revalidatePath(`/approvals/goal-navigators/${recordId}`);
  revalidatePath("/goal-navigator/history");
  revalidatePath("/qualitative-goal-navigator/history");

  return { ok: true as const, record };
}

export async function rejectNavigatorRecordAction(recordId: string, comment: string) {
  const session = await getServerSession();
  if (!canApprove(session)) {
    return { ok: false as const, message: "承認権限がありません" };
  }
  if (!comment.trim()) {
    return { ok: false as const, message: "やり直し依頼の理由を入力してください" };
  }

  const record = await rejectNavigatorRecord(
    recordId,
    session?.name || "承認者",
    comment.trim(),
    session?.id || session?.employeeId
  );
  if (!record) {
    return { ok: false as const, message: "対象レコードが見つかりません" };
  }

  revalidatePath("/approvals/goal-navigators");
  revalidatePath(`/approvals/goal-navigators/${recordId}`);
  revalidatePath("/goal-navigator/history");
  revalidatePath("/qualitative-goal-navigator/history");

  return { ok: true as const, record };
}

/** 管理者は全件、本人は自分のレコードのみ閲覧可能 */
export async function getNavigatorRecordDetail(recordId: string): Promise<
  { ok: true; record: NavigatorRecord; canApprove: boolean; isOwner: boolean } | { ok: false; message: string }
> {
  const session = await getServerSession();
  if (!session) return { ok: false, message: "ログイン情報を確認できませんでした" };

  const record = await getNavigatorRecordById(recordId);
  if (!record) return { ok: false, message: "対象レコードが見つかりません" };

  const ownerId = session.employeeId || session.id || session.email;
  const isOwner = Boolean(ownerId && record.ownerId === ownerId);
  const approver = canApprove(session);

  if (!approver && !isOwner) {
    return { ok: false, message: "この目標設定を閲覧する権限がありません" };
  }

  return { ok: true, record, canApprove: approver, isOwner };
}

/** 進捗報告の追加：本人または承認者のみ */
export async function addProgressUpdateAction(recordId: string, body: string, percent?: number) {
  const session = await getServerSession();
  if (!session) return { ok: false as const, message: "ログイン情報を確認できませんでした" };
  if (!body.trim()) return { ok: false as const, message: "進捗の内容を入力してください" };

  const target = await getNavigatorRecordById(recordId);
  if (!target) return { ok: false as const, message: "対象レコードが見つかりません" };

  const ownerId = session.employeeId || session.id || session.email;
  const isOwner = Boolean(ownerId && target.ownerId === ownerId);
  if (!isOwner && !canApprove(session)) {
    return { ok: false as const, message: "進捗を入力する権限がありません" };
  }

  const record = await addProgressUpdate(recordId, {
    authorId: session.id || session.employeeId,
    authorName: session.name,
    body: body.trim(),
    percent: typeof percent === "number" && !Number.isNaN(percent) ? Math.max(0, Math.min(100, percent)) : undefined,
  });
  if (!record) return { ok: false as const, message: "進捗の保存に失敗しました" };

  revalidatePath(`/approvals/goal-navigators/${recordId}`);
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
  return records.filter((record) => record.status === "submitted" || record.status === "rejected");
}

/** 承認一覧などのアクセス可否（管理者/人事のみ true） */
export async function getApprovalAccess(): Promise<boolean> {
  const session = await getServerSession();
  return canApprove(session);
}

export async function getApprovedNavigatorRecords(kind?: NavigatorKind): Promise<NavigatorRecord[]> {
  const session = await getServerSession();
  if (!canApprove(session)) return [];
  const records = await listNavigatorRecords({ kind, includeAll: true });
  return records.filter((record) => record.status === "approved");
}