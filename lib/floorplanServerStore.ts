import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabaseServer";
import type {
  FloorplanRecord,
  FloorplanRoom,
  FloorplanTemplate,
} from "@/lib/floorplanStore";

/**
 * Persistence uses Supabase Storage (object storage) instead of DB tables so
 * that no manual SQL / DDL is required. Each floorplan and template is stored
 * as a JSON object inside a private bucket. When Supabase env vars are not
 * configured we fall back to an in-memory store (dev convenience only).
 */

const BUCKET = "floorplans";
const PLAN_PREFIX = "plans";
const TEMPLATE_PREFIX = "templates";

// ---- In-memory fallback (only when Supabase is not configured) ----
type GlobalStore = {
  floorplans: Map<string, FloorplanRecord>;
  templates: FloorplanTemplate[];
};
const g = globalThis as unknown as { __keyatreeFloorplanStore?: GlobalStore };
function memory(): GlobalStore {
  if (!g.__keyatreeFloorplanStore) {
    g.__keyatreeFloorplanStore = { floorplans: new Map(), templates: [] };
  }
  return g.__keyatreeFloorplanStore;
}

export type SaveFloorplanInput = Omit<
  FloorplanRecord,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

// ---- Storage helpers ----
let bucketReady = false;
async function ensureBucket(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<void> {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: false,
    });
    // Ignore "already exists" races.
    if (error && !/exist/i.test(error.message)) {
      throw new Error(`bucket作成に失敗: ${error.message}`);
    }
  }
  bucketReady = true;
}

function planPath(propertyId: string) {
  return `${PLAN_PREFIX}/${encodeURIComponent(propertyId)}.json`;
}
function templatePath(id: string) {
  return `${TEMPLATE_PREFIX}/${id}.json`;
}

async function putJson(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  path: string,
  value: unknown
): Promise<void> {
  const body = JSON.stringify(value);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: "application/json",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

async function getJson<T>(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  path: string
): Promise<T | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function listJson<T>(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  prefix: string
): Promise<T[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 });
  if (error || !data) return [];
  const files = data.filter((item) => item.name.endsWith(".json"));
  const results = await Promise.all(
    files.map((item) => getJson<T>(supabase, `${prefix}/${item.name}`))
  );
  return results.filter((r): r is Awaited<T> => r !== null) as T[];
}

// ---- Public API ----
export async function listFloorplans(): Promise<FloorplanRecord[]> {
  if (!isSupabaseEnabled()) {
    return Array.from(memory().floorplans.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const plans = await listJson<FloorplanRecord>(supabase, PLAN_PREFIX);
  return plans.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export async function getFloorplanByProperty(
  propertyId: string
): Promise<FloorplanRecord | null> {
  if (!isSupabaseEnabled()) {
    return memory().floorplans.get(propertyId) ?? null;
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  return getJson<FloorplanRecord>(supabase, planPath(propertyId));
}

export async function saveFloorplan(
  input: SaveFloorplanInput
): Promise<FloorplanRecord> {
  const now = new Date().toISOString();

  if (!isSupabaseEnabled()) {
    const store = memory();
    const existing = store.floorplans.get(input.propertyId);
    const record: FloorplanRecord = {
      id: existing?.id ?? input.id ?? crypto.randomUUID(),
      propertyId: input.propertyId,
      propertyName: input.propertyName,
      rooms: input.rooms,
      symbols: input.symbols,
      dimensions: input.dimensions,
      texts: input.texts,
      walls: input.walls,
      thumbnail: input.thumbnail,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    store.floorplans.set(input.propertyId, record);
    return record;
  }

  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const existing = await getJson<FloorplanRecord>(
    supabase,
    planPath(input.propertyId)
  );
  const record: FloorplanRecord = {
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    propertyId: input.propertyId,
    propertyName: input.propertyName,
    rooms: input.rooms,
    symbols: input.symbols,
    dimensions: input.dimensions,
    texts: input.texts,
    walls: input.walls,
    thumbnail: input.thumbnail,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await putJson(supabase, planPath(input.propertyId), record);
  return record;
}

export async function listTemplates(): Promise<FloorplanTemplate[]> {
  if (!isSupabaseEnabled()) {
    return memory()
      .templates.slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const templates = await listJson<FloorplanTemplate>(supabase, TEMPLATE_PREFIX);
  return templates.sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );
}

export async function saveTemplate(
  name: string,
  rooms: FloorplanRoom[]
): Promise<FloorplanTemplate> {
  const now = new Date().toISOString();

  if (!isSupabaseEnabled()) {
    const template: FloorplanTemplate = {
      id: crypto.randomUUID(),
      name,
      rooms,
      createdAt: now,
    };
    memory().templates.unshift(template);
    return template;
  }

  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const template: FloorplanTemplate = {
    id: crypto.randomUUID(),
    name,
    rooms,
    createdAt: now,
  };
  await putJson(supabase, templatePath(template.id), template);
  return template;
}
