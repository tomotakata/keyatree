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

export type FloorplanTemplate = {
  id: string;
  name: string;
  rooms: FloorplanRoom[];
  createdAt: string;
};

export type FloorplanRecord = {
  id: string;
  propertyId: string;
  propertyName: string;
  rooms: FloorplanRoom[];
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
  return readJson<FloorplanRecord[]>(FLOORPLANS_KEY, []).find((record) => record.propertyId === propertyId) ?? null;
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