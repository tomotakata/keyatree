import { NextResponse } from "next/server";
import { getFloorplanByProperty } from "@/lib/floorplanServerStore";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const plan = await getFloorplanByProperty(propertyId);
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
