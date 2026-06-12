import { cookies } from "next/headers";

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

export function listNavigatorRecords(params: {
  kind?: NavigatorKind;
  employeeId?: string;
  includeAll?: boolean;
}) {
  const records = getStore();
  const filtered = records.filter((record) => {
    if (params.kind && record.kind !== params.kind) return false;
    if (!params.includeAll && params.employeeId && record.employeeId !== params.employeeId) return false;
    return true;
  });
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertNavigatorRecord(input: {
  id?: string;
  kind: NavigatorKind;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: RecordStatus;
  answers: Record<string, string>;
}) {
  const records = getStore();
  const now = new Date().toISOString();
  const existingIndex = input.id ? records.findIndex((record) => record.id === input.id) : -1;

  if (existingIndex >= 0) {
    const current = records[existingIndex];
    const next: NavigatorRecord = {
      ...current,
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

export function approveNavigatorRecord(recordId: string, approverName: string) {
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