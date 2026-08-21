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
