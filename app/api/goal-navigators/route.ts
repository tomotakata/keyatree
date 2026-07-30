import { NextResponse } from "next/server";
import {
  listNavigatorRecords,
  getServerSession,
  canApprove,
} from "@/lib/goalNavigatorStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId") || "";
    if (!employeeId) {
      return NextResponse.json({ error: "employeeId required" }, { status: 400 });
    }

    const session = await getServerSession();
    const isAdmin = canApprove(session);
    const isOwner =
      !!session &&
      (session.employeeId === employeeId || session.id === employeeId);
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const all = await listNavigatorRecords({ includeAll: true });
    const records = all.filter(
      (r) => r.employeeId === employeeId || r.ownerId === employeeId
    );

    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
