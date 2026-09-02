import { NextResponse } from "next/server";
import { findAccountByEmail } from "@/lib/mockAccounts";
import { findStoredAccountByEmail } from "@/lib/staffServerStore";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const trimmed = (email ?? "").trim();
    const pass = (password ?? "").trim();
    if (!trimmed || !pass) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    // 静的アカウント → Supabase保存アカウント の順で検索（メールは大小/空白を無視）
    const account = findAccountByEmail(trimmed) ?? (await findStoredAccountByEmail(trimmed));

    if (!account) {
      return NextResponse.json({ field: "email", message: "このメールアドレスは登録されていません" });
    }
    // パスワードは前後空白を無視して比較（コピペ時の余分な空白対策）
    if ((account.password ?? "").trim() !== pass) {
      return NextResponse.json({ field: "password", message: "パスワードが正しくありません" });
    }
    if (!account.isActive) {
      return NextResponse.json({ field: "form", message: "このアカウントは無効化されています。管理者にお問い合わせください" });
    }

    return NextResponse.json({
      ok: true,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        permissionId: account.permissionId,
        permissionName: account.permissionName,
        employeeId: account.employeeId,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
