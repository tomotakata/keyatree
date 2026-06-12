import { cookies } from "next/headers";
import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabaseServer";

export type NavigatorKind = "quantitative" | "qualitative";
export type RecordStatus = "draft" | "submitted" | "approved";

export type NavigatorSession = {
  id?: string;
  name: string;
  email: string;
  permissionId?: string;
  permissionName?: string;
  employeeId?: string;
};

export type NavigatorRecord = {
  id: string;
  ownerId: string;
  kind: NavigatorKind;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: RecordStatus;
  answers: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
};

const globalStore = globalThis as typeof globalThis & {
  __keyatreeNavigatorRecords?: NavigatorRecord[];
};

type AuditActor = {
  actorId?: string;
  actorName?: string;
};

function getStore() {
  if (!globalStore.__keyatreeNavigatorRecords) {
    globalStore.__keyatreeNavigatorRecords = [];
  }
  return globalStore.__keyatreeNavigatorRecords;
}

export async function getServerSession(): Promise<NavigatorSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("kt_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NavigatorSession;
  } catch {
    return null;
  }
}

export function canApprove(session: NavigatorSession | null) {
  return session?.permissionId === "admin" || session?.permissionId === "hr_manager";
}

function normalizeRecord(record: {
  id: string;
  owner_id?: string | null;
  kind: NavigatorKind;
  employee_id: string;
  employee_name: string;
  department: string;
  title: string;
  status: RecordStatus;
  answers: Record<string, string>;
  created_at: string;
  updated_at: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
}): NavigatorRecord {
  return {
    id: record.id,
    ownerId: record.owner_id ?? record.employee_id,
    kind: record.kind,
    employeeId: record.employee_id,
    employeeName: record.employee_name,
    department: record.department,
    title: record.title,
    status: record.status,
    answers: record.answers,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    submittedAt: record.submitted_at ?? undefined,
    approvedAt: record.approved_at ?? undefined,
    approvedBy: record.approved_by ?? undefined,
  };
}

async function writeAuditLog(input: {
  entityId: string;
  operation: "create" | "update" | "approve";
  beforeData?: NavigatorRecord | null;
  afterData?: NavigatorRecord | null;
  actor?: AuditActor;
}) {
  if (!isSupabaseEnabled()) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("audit_logs").insert({
    entity_type: "goal_navigator_record",
    entity_id: input.entityId,
    operation: input.operation,
    actor_id: input.actor?.actorId ?? null,
    actor_name: input.actor?.actorName ?? null,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
  });
}

export async function listNavigatorRecords(params: {
  kind?: NavigatorKind;
  ownerId?: string;
  employeeId?: string;
  includeAll?: boolean;
}) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("goal_navigator_records")
      .select("*")
      .order("updated_at", { ascending: false });

    if (params.kind) {
      query = query.eq("kind", params.kind);
    }
    if (!params.includeAll && params.ownerId) {
      query = query.eq("owner_id", params.ownerId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map(normalizeRecord);
  }

  const records = getStore();
  const filtered = records.filter((record) => {
    if (params.kind && record.kind !== params.kind) return false;
    if (!params.includeAll && params.ownerId && record.ownerId !== params.ownerId) return false;
    return true;
  });
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertNavigatorRecord(input: {
  id?: string;
  ownerId: string;
  kind: NavigatorKind;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: RecordStatus;
  answers: Record<string, string>;
  actor?: AuditActor;
}) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (input.id) {
      const { data: beforeRows, error: beforeError } = await supabase
        .from("goal_navigator_records")
        .select("*")
        .eq("id", input.id)
        .limit(1);
      if (beforeError) throw new Error(beforeError.message);
      const before = beforeRows?.[0] ? normalizeRecord(beforeRows[0]) : null;

      const payload = {
        owner_id: input.ownerId,
        kind: input.kind,
        employee_id: input.employeeId,
        employee_name: input.employeeName,
        department: input.department,
        title: input.title,
        status: input.status,
        answers: input.answers,
        submitted_at: input.status === "submitted" ? now : before?.submittedAt ?? null,
      };

      const { data, error } = await supabase
        .from("goal_navigator_records")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .limit(1);
      if (error) throw new Error(error.message);
      const record = normalizeRecord(data[0]);
      await writeAuditLog({
        entityId: record.id,
        operation: "update",
        beforeData: before,
        afterData: record,
        actor: input.actor,
      });
      return record;
    }

    const payload = {
      owner_id: input.ownerId,
      kind: input.kind,
      employee_id: input.employeeId,
      employee_name: input.employeeName,
      department: input.department,
      title: input.title,
      status: input.status,
      answers: input.answers,
      submitted_at: input.status === "submitted" ? now : null,
    };

    const { data, error } = await supabase
      .from("goal_navigator_records")
      .insert(payload)
      .select("*")
      .limit(1);
    if (error) throw new Error(error.message);
    const record = normalizeRecord(data[0]);
    await writeAuditLog({
      entityId: record.id,
      operation: "create",
      afterData: record,
      actor: input.actor,
    });
    return record;
  }

  const records = getStore();
  const now = new Date().toISOString();
  const existingIndex = input.id ? records.findIndex((record) => record.id === input.id) : -1;

  if (existingIndex >= 0) {
    const current = records[existingIndex];
    const next: NavigatorRecord = {
      ...current,
      ownerId: input.ownerId,
      kind: input.kind,
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      department: input.department,
      title: input.title,
      status: input.status,
      answers: input.answers,
      updatedAt: now,
      submittedAt: input.status === "submitted" ? now : current.submittedAt,
    };
    records[existingIndex] = next;
    return next;
  }

  const created: NavigatorRecord = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    kind: input.kind,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    department: input.department,
    title: input.title,
    status: input.status,
    answers: input.answers,
    createdAt: now,
    updatedAt: now,
    submittedAt: input.status === "submitted" ? now : undefined,
  };
  records.unshift(created);
  return created;
}

export async function approveNavigatorRecord(recordId: string, approverName: string, actorId?: string) {
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    const { data: beforeRows, error: beforeError } = await supabase
      .from("goal_navigator_records")
      .select("*")
      .eq("id", recordId)
      .limit(1);
    if (beforeError) throw new Error(beforeError.message);
    if (!beforeRows?.[0]) return null;
    const before = normalizeRecord(beforeRows[0]);

    const { data, error } = await supabase
      .from("goal_navigator_records")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: approverName,
      })
      .eq("id", recordId)
      .select("*")
      .limit(1);
    if (error) throw new Error(error.message);
    const record = normalizeRecord(data[0]);
    await writeAuditLog({
      entityId: record.id,
      operation: "approve",
      beforeData: before,
      afterData: record,
      actor: {
        actorId,
        actorName: approverName,
      },
    });
    return record;
  }

  const records = getStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) return null;
  const now = new Date().toISOString();
  record.status = "approved";
  record.approvedAt = now;
  record.updatedAt = now;
  record.approvedBy = approverName;
  return record;
}