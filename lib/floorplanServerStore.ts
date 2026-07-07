import { getSupabaseAdmin, isSupabaseEnabled } from "@/lib/supabaseServer";
import type {
  FloorplanRecord,
  FloorplanRoom,
  FloorplanTemplate,
} from "@/lib/floorplanStore";

// In-memory fallback used only when Supabase env vars are not configured.
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

type Row = {
  id: string;
  property_id: string;
  property_name: string;
  data: Partial<Pick<FloorplanRecord, "rooms" | "symbols" | "dimensions" | "texts" | "walls">>;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: Row): FloorplanRecord {
  const data = row.data ?? {};
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyName: row.property_name ?? "",
    rooms: data.rooms ?? [],
    symbols: data.symbols ?? [],
    dimensions: data.dimensions ?? [],
    texts: data.texts ?? [],
    walls: data.walls ?? [],
    thumbnail: row.thumbnail ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SaveFloorplanInput = Omit<FloorplanRecord, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export async function listFloorplans(): Promise<FloorplanRecord[]> {
  if (!isSupabaseEnabled()) {
    return Array.from(memory().floorplans.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("floorplans")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as Row[]).map(rowToRecord);
}

export async function getFloorplanByProperty(
  propertyId: string
): Promise<FloorplanRecord | null> {
  if (!isSupabaseEnabled()) {
    return memory().floorplans.get(propertyId) ?? null;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("floorplans")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToRecord(data as Row) : null;
}

export async function saveFloorplan(input: SaveFloorplanInput): Promise<FloorplanRecord> {
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
  const payload = {
    property_id: input.propertyId,
    property_name: input.propertyName,
    data: {
      rooms: input.rooms,
      symbols: input.symbols,
      dimensions: input.dimensions,
      texts: input.texts,
      walls: input.walls,
    },
    thumbnail: input.thumbnail ?? null,
    updated_at: now,
  };
  const { data, error } = await supabase
    .from("floorplans")
    .upsert(payload, { onConflict: "property_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToRecord(data as Row);
}

export async function listTemplates(): Promise<FloorplanTemplate[]> {
  if (!isSupabaseEnabled()) {
    return memory().templates.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("floorplan_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as { id: string; name: string; rooms: FloorplanRoom[]; created_at: string }[]).map(
    (row) => ({ id: row.id, name: row.name, rooms: row.rooms ?? [], createdAt: row.created_at })
  );
}

export async function saveTemplate(
  name: string,
  rooms: FloorplanRoom[]
): Promise<FloorplanTemplate> {
  const now = new Date().toISOString();
  if (!isSupabaseEnabled()) {
    const template: FloorplanTemplate = { id: crypto.randomUUID(), name, rooms, createdAt: now };
    memory().templates.unshift(template);
    return template;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("floorplan_templates")
    .insert({ name, rooms })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  const row = data as { id: string; name: string; rooms: FloorplanRoom[]; created_at: string };
  return { id: row.id, name: row.name, rooms: row.rooms ?? [], createdAt: row.created_at };
}
