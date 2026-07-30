// 目標ナビゲーター等のクライアント側 localStorage を「ログインユーザー単位」で
// 分離するための共通ヘルパー。
// これまで全ユーザーで共有のグローバルキーに保存していたため、
// どのスタッフの詳細ページでも同じ目標内容が表示される不具合があった。
// ユーザー（employeeId）ごとに名前空間を分けることで、各スタッフのデータを独立管理する。

export const QUANT_DRAFT_BASE = "keyatree_goal_navigator_draft";
export const QUAL_DRAFT_BASE = "keyatree_qualitative_goal_navigator_draft";

/** ブラウザの kt_session Cookie からログイン中ユーザーの employeeId を取得する。 */
export function currentEmployeeId(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)kt_session=([^;]+)/);
  if (!m) return "";
  try {
    const session = JSON.parse(decodeURIComponent(m[1])) as { employeeId?: string };
    return session.employeeId || "";
  } catch {
    return "";
  }
}

/** ベースキーをユーザー単位に名前空間化する。 */
export function nsKey(baseKey: string, employeeId?: string): string {
  const emp = (employeeId ?? currentEmployeeId()) || "guest";
  return `${baseKey}__u_${emp}`;
}

/** 進捗ログ用キー（レコード単位＋ユーザー単位）。 */
export function progressLogsKey(recordId: string, employeeId?: string): string {
  const emp = (employeeId ?? currentEmployeeId()) || "guest";
  return `keyatree_progress_logs__u_${emp}__${recordId}`;
}
