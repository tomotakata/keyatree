"use server";

import { revalidatePath } from "next/cache";
import {
  addItemComment,
  addProgressReply,
  addProgressUpdate,
  approveNavigatorRecord,
  canApprove,
  getNavigatorRecordById,
  getServerSession,
  listNavigatorRecords,
  rejectNavigatorRecord,
  updateNavigatorMetrics,
  type ItemComment,
  type NavigatorKind,
  type NavigatorRecord,
  upsertNavigatorRecord,
} from "@/lib/goalNavigatorStore";
import { getStaff } from "@/lib/staffServerStore";

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

/** 進捗へのコメント返信：本人または承認者のみ */
export async function addProgressReplyAction(recordId: string, updateId: string, body: string) {
  const session = await getServerSession();
  if (!session) return { ok: false as const, message: "ログイン情報を確認できませんでした" };
  if (!body.trim()) return { ok: false as const, message: "コメントを入力してください" };

  const target = await getNavigatorRecordById(recordId);
  if (!target) return { ok: false as const, message: "対象レコードが見つかりません" };

  const ownerId = session.employeeId || session.id || session.email;
  const isOwner = Boolean(ownerId && target.ownerId === ownerId);
  const approver = canApprove(session);
  if (!isOwner && !approver) {
    return { ok: false as const, message: "コメントを入力する権限がありません" };
  }

  const record = await addProgressReply(recordId, updateId, {
    authorId: session.id || session.employeeId,
    authorName: session.name,
    isApprover: approver,
    body: body.trim(),
  });
  if (!record) return { ok: false as const, message: "コメントの保存に失敗しました" };

  revalidatePath(`/approvals/goal-navigators/${recordId}`);

  return { ok: true as const, record };
}

/** 進捗数値・結果数値の後日更新：本人または承認者のみ。承認ステータスは変えない */
export async function updateGoalMetricsAction(recordId: string, patch: Record<string, string>) {
  const session = await getServerSession();
  if (!session) return { ok: false as const, message: "ログイン情報を確認できませんでした" };

  const target = await getNavigatorRecordById(recordId);
  if (!target) return { ok: false as const, message: "対象レコードが見つかりません" };

  const ownerId = session.employeeId || session.id || session.email;
  const isOwner = Boolean(ownerId && target.ownerId === ownerId);
  if (!isOwner && !canApprove(session)) {
    return { ok: false as const, message: "この目標を更新する権限がありません" };
  }

  // 許可するキーのみ（進捗数値・結果数値）に限定
  const allowed = new Set([
    "company_progress",
    "company_result",
    "team_progress",
    "team_result",
    "personal_progress",
    "personal_result",
  ]);
  const safePatch: Record<string, string> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.has(k)) safePatch[k] = String(v ?? "");
  }
  if (Object.keys(safePatch).length === 0) {
    return { ok: false as const, message: "更新対象の数値がありません" };
  }

  const record = await updateNavigatorMetrics(recordId, safePatch);
  if (!record) return { ok: false as const, message: "更新に失敗しました" };

  revalidatePath("/goal-navigator");
  revalidatePath("/goal-navigator/history");
  revalidatePath(`/approvals/goal-navigators/${recordId}`);

  return { ok: true as const, record };
}

/** 目標項目への承認者コメント：承認者（管理者/人事）のみ。複数人・複数件可 */
export async function addItemCommentAction(
  recordId: string,
  target: ItemComment["target"],
  body: string
) {
  const session = await getServerSession();
  if (!canApprove(session)) {
    return { ok: false as const, message: "コメントする権限がありません（承認者のみ）" };
  }
  if (!body.trim()) return { ok: false as const, message: "コメントを入力してください" };

  const record = await addItemComment(recordId, {
    authorId: session?.id || session?.employeeId,
    authorName: session?.name || "承認者",
    isApprover: true,
    target,
    body: body.trim(),
  });
  if (!record) return { ok: false as const, message: "対象レコードが見つかりません" };

  revalidatePath("/goal-navigator");
  revalidatePath("/goal-navigator/history");
  revalidatePath(`/approvals/goal-navigators/${recordId}`);

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

/** ログイン中スタッフのプロフィール（名前・部署・グレード）を返す。定性シートの能力項目フィルタ等で使用。 */
export async function getMyProfile(): Promise<{
  name: string;
  department: string;
  grade: string;
  employeeId: string;
} | null> {
  const session = await getServerSession();
  if (!session) return null;
  let grade = "";
  let department = "";
  const employeeId = session.employeeId || "";
  if (employeeId) {
    try {
      const staff = await getStaff(employeeId);
      if (staff) {
        grade = staff.grade || "";
        department = staff.department || "";
      }
    } catch {
      // フォールバック（取得失敗時は空のまま）
    }
  }
  return { name: session.name || "", department, grade, employeeId };
}