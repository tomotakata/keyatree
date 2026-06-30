"use client";

export type FloorplanRoomType =
  | "living"
  | "bedroom"
  | "bedroom2"
  | "bathroom"
  | "toilet"
  | "kitchen"
  | "entrance"
  | "storage"
  | "balcony";

export type FloorplanRoom = {
  id: string;
  typeId: FloorplanRoomType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  border: string;
};

export type FloorplanSymbolType = "door" | "window" | "sliding" | "north";

export type FloorplanSymbol = {
  id: string;
  type: FloorplanSymbolType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
};

export type FloorplanText = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
};

export type FloorplanTemplate = {
  id: string;
  name: string;
  rooms: FloorplanRoom[];
  createdAt: string;
};

export type FloorplanDimension = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
};

export type FloorplanRecord = {
  id: string;
  propertyId: string;
  propertyName: string;
  rooms: FloorplanRoom[];
  symbols: FloorplanSymbol[];
  dimensions: FloorplanDimension[];
  texts: FloorplanText[];
  updatedAt: string;
  createdAt: string;
  thumbnail?: string;
};

export type PropertyRecord = {
  id: string;
  name: string;
  address: string;
  type: string;
  rent: string;
  status: string;
  station: string;
};

const PROPERTIES_KEY = "keyatree_properties_v1";
const FLOORPLANS_KEY = "keyatree_floorplans_v1";
const TEMPLATES_KEY = "keyatree_floorplan_templates_v1";
const SEED_KEY = "keyatree_floorplan_seed_v1";

const seedProperties: PropertyRecord[] = [
  {
    id: "prop-001",
    name: "サンプル物件 A",
    address: "山梨県甲府市中央1-2-3",
    type: "2LDK",
    rent: "95,000円",
    status: "募集中",
    station: "甲府駅 徒歩8分",
  },
  {
    id: "prop-002",
    name: "Keyaki Residence 甲府",
    address: "山梨県甲府市丸の内2-10-8",
    type: "1LDK",
    rent: "82,000円",
    status: "空室予定",
    station: "甲府駅 徒歩5分",
  },
  {
    id: "prop-003",
    name: "グリーンヒル石和 203",
    address: "山梨県笛吹市石和町広瀬12-4",
    type: "3DK",
    rent: "68,000円",
    status: "管理中",
    station: "石和温泉駅 車6分",
  },
];

const seedRooms: FloorplanRoom[] = [
  { id: "room_1", typeId: "entrance", label: "玄関", x: 40, y: 460, w: 120, h: 80, color: "#f3f4f6", border: "#6b7280" },
  { id: "room_2", typeId: "living", label: "LDK", x: 40, y: 120, w: 300, h: 320, color: "#d1fae5", border: "#059669" },
  { id: "room_3", typeId: "bedroom", label: "洋室1", x: 380, y: 120, w: 200, h: 180, color: "#dbeafe", border: "#2563eb" },
  { id: "room_4", typeId: "bathroom", label: "浴室", x: 380, y: 340, w: 100, h: 100, color: "#e0e7ff", border: "#6366f1" },
  { id: "room_5", typeId: "toilet", label: "トイレ", x: 500, y: 340, w: 80, h: 100, color: "#fce7f3", border: "#db2777" },
];

const seedSymbols: FloorplanSymbol[] = [
  { id: "symbol_1", type: "north", x: 730, y: 36, w: 34, h: 34 },
  { id: "symbol_2", type: "door", x: 156, y: 438, w: 42, h: 42, rotation: 0 },
  { id: "symbol_3", type: "window", x: 420, y: 104, w: 80, h: 16, rotation: 0 },
  { id: "symbol_4", type: "sliding", x: 338, y: 220, w: 90, h: 20, rotation: 90 },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function seedFloorplanData() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_KEY)) return;
  writeJson(PROPERTIES_KEY, seedProperties);
  writeJson<FloorplanRecord[]>(FLOORPLANS_KEY, [
    {
      id: crypto.randomUUID(),
      propertyId: "prop-001",
      propertyName: "サンプル物件 A",
      rooms: seedRooms,
      symbols: seedSymbols,
      dimensions: [
        { id: "dim_1", x1: 40, y1: 108, x2: 340, y2: 108, label: "4.5m" },
        { id: "dim_2", x1: 592, y1: 120, x2: 592, y2: 300, label: "2.7m" },
      ],
      texts: [
        { id: "text_1", text: "南向き", x: 662, y: 88, fontSize: 14 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  writeJson<FloorplanTemplate[]>(TEMPLATES_KEY, [
    { id: crypto.randomUUID(), name: "2LDK テンプレート", rooms: seedRooms, createdAt: new Date().toISOString() },
  ]);
  window.localStorage.setItem(SEED_KEY, "1");
}

export function getProperties() {
  return readJson<PropertyRecord[]>(PROPERTIES_KEY, seedProperties);
}

export function getProperty(id: string) {
  return getProperties().find((property) => property.id === id) ?? null;
}

export function getFloorplan(propertyId: string) {
  const record = readJson<FloorplanRecord[]>(FLOORPLANS_KEY, []).find((item) => item.propertyId === propertyId) ?? null;
  if (!record) return null;
  return { ...record, symbols: record.symbols ?? [], dimensions: record.dimensions ?? [], texts: record.texts ?? [] };
}

export function getAllFloorplans() {
  return readJson<FloorplanRecord[]>(FLOORPLANS_KEY, []).map((record) => ({
    ...record,
    symbols: record.symbols ?? [],
    dimensions: record.dimensions ?? [],
    texts: record.texts ?? [],
  }));
}

export function saveFloorplan(input: Omit<FloorplanRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const all = readJson<FloorplanRecord[]>(FLOORPLANS_KEY, []);
  const now = new Date().toISOString();
  const foundIndex = all.findIndex((record) => record.propertyId === input.propertyId);
  if (foundIndex >= 0) {
    all[foundIndex] = { ...all[foundIndex], ...input, updatedAt: now };
    writeJson(FLOORPLANS_KEY, all);
    return all[foundIndex];
  }
  const created: FloorplanRecord = {
    id: input.id ?? crypto.randomUUID(),
    propertyId: input.propertyId,
    propertyName: input.propertyName,
    rooms: input.rooms,
    symbols: input.symbols,
    dimensions: input.dimensions,
    texts: input.texts,
    thumbnail: input.thumbnail,
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(created);
  writeJson(FLOORPLANS_KEY, all);
  return created;
}

export function getFloorplanTemplates() {
  return readJson<FloorplanTemplate[]>(TEMPLATES_KEY, []);
}

export function saveFloorplanTemplate(name: string, rooms: FloorplanRoom[]) {
  const all = getFloorplanTemplates();
  const template: FloorplanTemplate = {
    id: crypto.randomUUID(),
    name,
    rooms,
    createdAt: new Date().toISOString(),
  };
  all.unshift(template);
  writeJson(TEMPLATES_KEY, all);
  return template;
}