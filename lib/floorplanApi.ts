"use client";

import type {
  FloorplanRecord,
  FloorplanRoom,
  FloorplanTemplate,
} from "@/lib/floorplanStore";

export type SaveFloorplanInput = Omit<
  FloorplanRecord,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export async function fetchFloorplan(
  propertyId: string
): Promise<FloorplanRecord | null> {
  const res = await fetch(`/api/floorplans/${encodeURIComponent(propertyId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan ?? null;
}

export async function fetchAllFloorplans(): Promise<FloorplanRecord[]> {
  const res = await fetch("/api/floorplans", { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.plans ?? [];
}

export async function saveFloorplanRemote(
  input: SaveFloorplanInput
): Promise<FloorplanRecord | null> {
  const res = await fetch("/api/floorplans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan ?? null;
}

export async function fetchTemplates(): Promise<FloorplanTemplate[]> {
  const res = await fetch("/api/floorplan-templates", { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.templates ?? [];
}

export async function saveTemplateRemote(
  name: string,
  rooms: FloorplanRoom[]
): Promise<FloorplanTemplate | null> {
  const res = await fetch("/api/floorplan-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rooms }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.template ?? null;
}
