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

type AuditActor = {
  actorId?: string;
  actorName?: string;
};

/**
 * 目標ナビの記録を Supabase Storage バケットに JSON として永続化する。
 * スタッフ/間取りと同じく DDL 不要のバケット方式。
 * env 未設定時はメモリfallback（開発用）。
 */
const BUCKET = "goal-navigator";
const RECORD_PREFIX = "records";
const AUDIT_PREFIX = "audit";

// ---- In-memory fallback ----
const globalStore = globalThis as typeof globalThis & {
  __keyatreeNavigatorRecords?: NavigatorRecord[];
};
function getStore() {
  if (!globalStore.__keyatreeNavigatorRecords) {
    globalStore.__keyatreeNavigatorRecords = [];
  }
  return globalStore.__keyatreeNavigatorRecords;
}

// ---- Storage helpers ----
type Admin = ReturnType<typeof getSupabaseAdmin>;
let bucketReady = false;
async function ensureBucket(supabase: Admin) {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
    if (error && !/exist/i.test(error.message)) {
      throw new Error(`bucket作成に失敗: ${error.message}`);
    }
  }
  bucketReady = true;
}

function recordPath(id: string) {
  return `${RECORD_PREFIX}/${encodeURIComponent(id)}.json`;
}

async function putJson(supabase: Admin, path: string, value: unknown) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, JSON.stringify(value), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

async function getJson<T>(supabase: Admin, path: string): Promise<T | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function listRecords(supabase: Admin): Promise<NavigatorRecord[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(RECORD_PREFIX, { limit: 1000 });
  if (error || !data) return [];
  const files = data.filter((i) => i.name.endsWith(".json"));
  const results = (await Promise.all(
    files.map((i) => getJson<NavigatorRecord>(supabase, `${RECORD_PREFIX}/${i.name}`))
  )) as (NavigatorRecord | null)[];
  return results.filter((r): r is NavigatorRecord => r !== null);
}

// ---- Session ----
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

// ---- Audit（ベストエフォート：失敗しても本処理を止めない）----
async function writeAuditLog(
  supabase: Admin,
  input: {
    entityId: string;
    operation: "create" | "update" | "approve";
    beforeData?: NavigatorRecord | null;
    afterData?: NavigatorRecord | null;
    actor?: AuditActor;
  }
) {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    await putJson(supabase, `${AUDIT_PREFIX}/${input.entityId}/${ts}.json`, {
      entityType: "goal_navigator_record",
      entityId: input.entityId,
      operation: input.operation,
      actorId: input.actor?.actorId ?? null,
      actorName: input.actor?.actorName ?? null,
      beforeData: input.beforeData ?? null,
      afterData: input.afterData ?? null,
      at: new Date().toISOString(),
    });
  } catch {
    // 監査ログの失敗は無視
  }
}

// ---- Records ----
export async function listNavigatorRecords(params: {
  kind?: NavigatorKind;
  ownerId?: string;
  employeeId?: string;
  includeAll?: boolean;
}) {
  let records: NavigatorRecord[];
  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);
    records = await listRecords(supabase);
  } else {
    records = getStore();
  }

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
  const now = new Date().toISOString();

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);

    const existing = input.id ? await getJson<NavigatorRecord>(supabase, recordPath(input.id)) : null;

    const record: NavigatorRecord = existing
      ? {
          ...existing,
          ownerId: input.ownerId,
          kind: input.kind,
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          department: input.department,
          title: input.title,
          status: input.status,
          answers: input.answers,
          updatedAt: now,
          submittedAt: input.status === "submitted" ? now : existing.submittedAt,
        }
      : {
          id: input.id || crypto.randomUUID(),
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

    await putJson(supabase, recordPath(record.id), record);
    await writeAuditLog(supabase, {
      entityId: record.id,
      operation: existing ? "update" : "create",
      beforeData: existing,
      afterData: record,
      actor: input.actor,
    });
    return record;
  }

  const records = getStore();
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
    id: input.id || crypto.randomUUID(),
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
  const now = new Date().toISOString();

  if (isSupabaseEnabled()) {
    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);
    const before = await getJson<NavigatorRecord>(supabase, recordPath(recordId));
    if (!before) return null;

    const record: NavigatorRecord = {
      ...before,
      status: "approved",
      approvedAt: now,
      updatedAt: now,
      approvedBy: approverName,
    };
    await putJson(supabase, recordPath(record.id), record);
    await writeAuditLog(supabase, {
      entityId: record.id,
      operation: "approve",
      beforeData: before,
      afterData: record,
      actor: { actorId, actorName: approverName },
    });
    return record;
  }

  const records = getStore();
  const record = records.find((item) => item.id === recordId);
  if (!record) return null;
  record.status = "approved";
  record.approvedAt = now;
  record.updatedAt = now;
  record.approvedBy = approverName;
  return record;
}
