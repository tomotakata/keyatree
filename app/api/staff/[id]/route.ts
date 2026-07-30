import { NextResponse } from "next/server";
import { getStaff, saveStaff, deleteStaff } from "@/lib/staffServerStore";
import type { Employee } from "@/lib/mockData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const staff = await getStaff(id);
    if (!staff) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getStaff(id);
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<Employee>;
    const updated = await saveStaff({ ...existing, ...patch, id });
    return NextResponse.json({ staff: updated });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteStaff(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
