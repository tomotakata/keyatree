import { NextResponse } from "next/server";
import { listStaff, saveStaff, saveAccount } from "@/lib/staffServerStore";
import type { Employee } from "@/lib/mockData";
import type { Account } from "@/lib/mockAccounts";

export async function GET() {
  try {
    const staff = await listStaff();
    return NextResponse.json({ staff });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employee = body?.employee as Employee | undefined;
    const account = body?.account as Account | undefined;
    if (!employee?.id) {
      return NextResponse.json({ error: "employee is required" }, { status: 400 });
    }
    const savedStaff = await saveStaff(employee);
    let savedAccount: Account | null = null;
    if (account?.email) {
      savedAccount = await saveAccount(account);
    }
    return NextResponse.json({ staff: savedStaff, account: savedAccount });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
