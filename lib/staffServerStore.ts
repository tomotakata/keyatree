import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabaseServer";
import type { Employee } from "@/lib/mockData";
import type { Account } from "@/lib/mockAccounts";

/**
 * スタッフ（Employee）とログインアカウント（Account）を Supabase Storage に
 * JSON オブジェクトとして永続化する。floorplan と同じく DDL 不要のバケット方式。
 * env 未設定時はメモリfallback（開発用）。
 */

const BUCKET = "staff";
const MEMBER_PREFIX = "members";
const ACCOUNT_PREFIX = "accounts";

// ---- In-memory fallback ----
type GlobalStore = { members: Map<string, Employee>; accounts: Map<string, Account> };
const g = globalThis as unknown as { __keyatreeStaffStore?: GlobalStore };
function memory(): GlobalStore {
  if (!g.__keyatreeStaffStore) {
    g.__keyatreeStaffStore = { members: new Map(), accounts: new Map() };
  }
  return g.__keyatreeStaffStore;
}

// ---- Storage helpers ----
let bucketReady = false;
async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
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

function memberPath(id: string) {
  return `${MEMBER_PREFIX}/${encodeURIComponent(id)}.json`;
}
function accountPath(id: string) {
  return `${ACCOUNT_PREFIX}/${encodeURIComponent(id)}.json`;
}

async function putJson(supabase: ReturnType<typeof getSupabaseAdmin>, path: string, value: unknown) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, JSON.stringify(value), {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

async function getJson<T>(supabase: ReturnType<typeof getSupabaseAdmin>, path: string): Promise<T | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as T;
  } catch {
    return null;
  }
}

async function listJson<T>(supabase: ReturnType<typeof getSupabaseAdmin>, prefix: string): Promise<T[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const files = data.filter((i) => i.name.endsWith(".json"));
  const results = (await Promise.all(
    files.map((i) => getJson<T>(supabase, `${prefix}/${i.name}`))
  )) as (T | null)[];
  return results.filter((r): r is T => r !== null);
}

// ---- Staff (Employee) ----
export async function listStaff(): Promise<Employee[]> {
  if (!isSupabaseEnabled()) return Array.from(memory().members.values());
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return listJson<Employee>(supabase, MEMBER_PREFIX);
}

export async function getStaff(id: string): Promise<Employee | null> {
  if (!isSupabaseEnabled()) return memory().members.get(id) ?? null;
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return getJson<Employee>(supabase, memberPath(id));
}

export async function saveStaff(emp: Employee): Promise<Employee> {
  if (!isSupabaseEnabled()) {
    memory().members.set(emp.id, emp);
    return emp;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, memberPath(emp.id), emp);
  return emp;
}

export async function deleteStaff(id: string): Promise<void> {
  if (!isSupabaseEnabled()) {
    const m = memory();
    m.members.delete(id);
    // 紐づくアカウントも削除
    for (const [key, acc] of m.accounts) {
      if (acc.employeeId === id) m.accounts.delete(key);
    }
    return;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await supabase.storage.from(BUCKET).remove([memberPath(id), accountPath(`acc_${id}`)]);
}

// ---- Accounts ----
export async function listStoredAccounts(): Promise<Account[]> {
  if (!isSupabaseEnabled()) return Array.from(memory().accounts.values());
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return listJson<Account>(supabase, ACCOUNT_PREFIX);
}

export async function saveAccount(acc: Account): Promise<Account> {
  if (!isSupabaseEnabled()) {
    memory().accounts.set(acc.id, acc);
    return acc;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  await putJson(supabase, accountPath(acc.id), acc);
  return acc;
}

export async function findStoredAccountByEmail(email: string): Promise<Account | null> {
  const list = await listStoredAccounts();
  const key = email.trim().toLowerCase();
  return list.find((a) => (a.email ?? "").trim().toLowerCase() === key) ?? null;
}
