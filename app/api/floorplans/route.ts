import { NextResponse } from "next/server";
import { listFloorplans, saveFloorplan } from "@/lib/floorplanServerStore";

export async function GET() {
  try {
    const plans = await listFloorplans();
    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }
    const saved = await saveFloorplan({
      id: body.id,
      propertyId: body.propertyId,
      propertyName: body.propertyName ?? "",
      managementNo: body.managementNo,
      buildingName: body.buildingName,
      roomNo: body.roomNo,
      postalCode: body.postalCode,
      address: body.address,
      rooms: body.rooms ?? [],
      symbols: body.symbols ?? [],
      dimensions: body.dimensions ?? [],
      texts: body.texts ?? [],
      walls: body.walls ?? [],
      thumbnail: body.thumbnail,
    });
    return NextResponse.json({ plan: saved });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
