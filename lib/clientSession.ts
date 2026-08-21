"use client";

export type SessionInfo = {
  id?: string;
  name: string;
  email: string;
  permissionId?: string;
  permissionName?: string;
  employeeId?: string;
};

/** ブラウザの kt_session Cookie からログイン中セッションを取得する（クライアント専用）。 */
export function getClientSession(): SessionInfo | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)kt_session=([^;]+)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as SessionInfo;
  } catch {
    return null;
  }
}

export function isAdminSession(session: SessionInfo | null): boolean {
  return session?.permissionId === "admin";
}

/** セッションから本人の従業員IDを返す（employeeId 優先、なければ id）。 */
export function sessionMemberId(session: SessionInfo | null): string {
  return session?.employeeId || session?.id || "";
}
