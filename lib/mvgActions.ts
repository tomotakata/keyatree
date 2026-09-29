"use server";

import { revalidatePath } from "next/cache";
import {
  createVote,
  getAvailablePeriods,
  getVoteCountsByPeriod,
  getVotesForEmployee,
  type MvgVote,
  type MvgRankingEntry,
} from "@/lib/mvgStore";
import { getServerSession } from "@/lib/goalNavigatorStore";
import { listStaff } from "@/lib/staffServerStore";

export async function castVoteAction(
  toEmployeeId: string,
  message: string,
  votedAt?: string
): Promise<{ ok: true; vote: MvgVote } | { ok: false; message: string }> {
  const session = await getServerSession();
  if (!session) {
    return { ok: false, message: "ログイン情報を確認できませんでした" };
  }

  const fromEmployeeId = session.employeeId || session.id;
  if (!fromEmployeeId) {
    return { ok: false, message: "投票者情報を特定できませんでした" };
  }
  if (fromEmployeeId === toEmployeeId) {
    return { ok: false, message: "自分自身への投票はできません" };
  }
  if (!message.trim()) {
    return { ok: false, message: "感謝メッセージを入力してください" };
  }

  const staff = await listStaff();
  const to = staff.find((s) => s.id === toEmployeeId);
  if (!to) return { ok: false, message: "投票先のスタッフが見つかりません" };

  const vote = await createVote({
    fromEmployeeId,
    fromEmployeeName: session.name,
    toEmployeeId,
    toEmployeeName: to.name,
    message: message.trim(),
    votedAt: votedAt || new Date().toISOString().slice(0, 10),
  });

  revalidatePath("/mvg");
  revalidatePath(`/employees/${toEmployeeId}`);

  return { ok: true, vote };
}

export async function getMvgRankingAction(period: string): Promise<{
  ok: true;
  ranking: MvgRankingEntry[];
  totalVotes: number;
} | { ok: false; message: string }> {
  const ranking = await getVoteCountsByPeriod(period);
  const totalVotes = ranking.reduce((sum, r) => sum + r.count, 0);
  return { ok: true, ranking, totalVotes };
}

export async function getMvgVotesForEmployeeAction(
  employeeId: string,
  period?: string
): Promise<{ ok: true; votes: MvgVote[] } | { ok: false; message: string }> {
  const votes = await getVotesForEmployee(employeeId, period);
  return { ok: true, votes };
}

export async function getMvgPeriodsAction(): Promise<{ ok: true; periods: string[] }> {
  const periods = await getAvailablePeriods();
  return { ok: true, periods };
}

export async function getMvgStaffWithRankingAction(period: string): Promise<{
  ok: true;
  staff: { id: string; name: string; photo?: string; team?: string }[];
  ranking: MvgRankingEntry[];
  totalVotes: number;
  periods: string[];
} | { ok: false; message: string }> {
  const [staff, rankingRes, periods] = await Promise.all([
    listStaff(),
    getMvgRankingAction(period),
    getAvailablePeriods(),
  ]);
  if (!rankingRes.ok) return rankingRes;
  return {
    ok: true,
    staff: staff.map((s) => ({ id: s.id, name: s.name, photo: s.photo, team: s.team || s.department })),
    ranking: rankingRes.ranking,
    totalVotes: rankingRes.totalVotes,
    periods,
  };
}
