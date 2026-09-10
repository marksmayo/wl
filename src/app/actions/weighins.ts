"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { clampToCompetitionWindow } from "@/lib/competition";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";
import { getLeaderboardData } from "@/lib/leaderboard";
import { computeRanksEverHeld } from "@/lib/badges/rankHistory";

export type WeighInFormState = {
  error?: string;
  success?: boolean;
  newBadges?: string[];
} | undefined;

const WeighInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date."),
  weight: z.coerce
    .number({ error: "Enter a valid weight." })
    .positive("Weight must be greater than zero.")
    .max(2000, "That doesn't look like a valid weight."),
});

export async function logWeighInAction(
  _prevState: WeighInFormState,
  formData: FormData
): Promise<WeighInFormState> {
  const session = await verifySession();

  const parsed = WeighInSchema.safeParse({
    date: formData.get("date"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { date } = parsed.data;
  // Cap at 2 decimal places regardless of what the client actually sent.
  const weight = Math.round(parsed.data.weight * 100) / 100;

  if (!clampToCompetitionWindow(date)) {
    return { error: "That date is outside the competition window (Sep 4 – Dec 12)." };
  }

  // For the "Oopsie" badge: the most recent entry strictly before the date
  // being submitted, i.e. what the user's weight was the last time they
  // logged, regardless of whether this submission is an edit or a backfill.
  const priorEntry = await prisma.weighIn.findFirst({
    where: { userId: session.userId, date: { lt: new Date(`${date}T00:00:00.000Z`) } },
    orderBy: { date: "desc" },
    select: { weight: true },
  });

  await prisma.weighIn.upsert({
    where: { userId_date: { userId: session.userId, date: new Date(`${date}T00:00:00.000Z`) } },
    update: { weight },
    create: {
      userId: session.userId,
      date: new Date(`${date}T00:00:00.000Z`),
      weight,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");

  const allWeighIns = await prisma.weighIn.findMany({
    where: { userId: session.userId },
    orderBy: { date: "asc" },
    select: { date: true, weight: true },
  });

  const [{ chartData, participants }, device] = await Promise.all([
    getLeaderboardData(),
    detectDevice(),
  ]);
  const ranksEverHeld = computeRanksEverHeld(chartData, participants);

  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    recordVisit: true,
    device,
    ranksEverHeld: ranksEverHeld.get(session.userId),
    afterWeighIn: {
      weighInDates: allWeighIns.map((w) => w.date.toISOString().slice(0, 10)),
      firstWeight: allWeighIns[0].weight,
      latestWeight: allWeighIns[allWeighIns.length - 1].weight,
      previousWeight: priorEntry?.weight ?? null,
    },
  });

  return { success: true, newBadges: newBadges.map((b) => b.id) };
}

export async function deleteWeighInAction(dateKey: string) {
  const session = await verifySession();
  await prisma.weighIn.deleteMany({
    where: { userId: session.userId, date: new Date(`${dateKey}T00:00:00.000Z`) },
  });
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
