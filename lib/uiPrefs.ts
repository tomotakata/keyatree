"use client";

import { getClientSession, sessionMemberId } from "@/lib/clientSession";

/**
 * 端末ごとのUI設定（非表示リスト・並べ替え）を localStorage に保存する。
 * ユーザーIDでキーを分けるため、同じ端末でも別ユーザーの設定は混ざらない。
 */
function userKey(scope: string): string {
  const uid = sessionMemberId(getClientSession()) || "anon";
  return `keyatree_ui_${scope}_${uid}`;
}

export function getHiddenIds(scope: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userKey(`hidden_${scope}`));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

export function setHiddenIds(scope: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(userKey(`hidden_${scope}`), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function toggleHiddenId(scope: string, id: string): string[] {
  const cur = getHiddenIds(scope);
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  setHiddenIds(scope, next);
  return next;
}

export function getSortPref(scope: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(userKey(`sort_${scope}`)) || fallback;
  } catch {
    return fallback;
  }
}

export function setSortPref(scope: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(userKey(`sort_${scope}`), value);
  } catch {
    /* ignore */
  }
}

/** 手動並べ替え（ドラッグ）の順序をID配列で保存・取得する。 */
export function getOrder(scope: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(userKey(`order_${scope}`));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

export function setOrder(scope: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(userKey(`order_${scope}`), JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** items を保存済みの手動順に並べ替える（順序に無いものは末尾へ）。 */
export function applyManualOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = idx.has(a.id) ? (idx.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bi = idx.has(b.id) ? (idx.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

/** ドラッグ結果: dragId を targetId の位置へ移動した新しいID配列を返す。 */
export function moveInOrder(ids: string[], dragId: string, targetId: string): string[] {
  if (dragId === targetId) return ids;
  const next = ids.filter((x) => x !== dragId);
  const targetIndex = next.indexOf(targetId);
  if (targetIndex === -1) return ids;
  next.splice(targetIndex, 0, dragId);
  return next;
}

