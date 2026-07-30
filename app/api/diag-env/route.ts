import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let host = "";
  try {
    host = new URL(url).host;
  } catch {
    host = "invalid-or-empty";
  }
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  let ref = "";
  try {
    ref = JSON.parse(
      Buffer.from(sr.split(".")[1] || "", "base64").toString()
    ).ref;
  } catch {
    ref = "n/a";
  }
  return NextResponse.json({ host, serviceRoleRef: ref, hasServiceRole: !!sr });
}
