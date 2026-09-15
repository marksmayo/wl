"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifySession } from "@/lib/dal";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";
import { buildAfterWeighInContext } from "@/lib/badges/weighinContext";

export type UpdateNameFormState = {
  error?: string;
  success?: boolean;
} | undefined;

const UpdateNameSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
});

export async function updateNameAction(
  _prevState: UpdateNameFormState,
  formData: FormData
): Promise<UpdateNameFormState> {
  const session = await verifySession();

  const parsed = UpdateNameSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { fullName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { fullName } });
  if (existing && existing.id !== session.userId) {
    return { error: "That name is already taken by someone else." };
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { fullName },
  });

  // The session cookie carries fullName too, so refresh it or the nav bar
  // would keep showing the old name until the next login.
  await createSession({ userId: user.id, fullName: user.fullName });

  revalidatePath("/", "layout");

  return { success: true };
}

export type UpdateUnitFormState = {
  error?: string;
  success?: boolean;
} | undefined;

const UpdateUnitSchema = z.object({
  unit: z.enum(["lbs", "kg"]),
});

const LBS_PER_KG = 2.2046226218;

export async function updateUnitAction(
  _prevState: UpdateUnitFormState,
  formData: FormData
): Promise<UpdateUnitFormState> {
  const session = await verifySession();

  const parsed = UpdateUnitSchema.safeParse({ unit: formData.get("unit") });
  if (!parsed.success) {
    return { error: "Pick lbs or kg." };
  }

  const { unit: nextUnit } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (user.unit === nextUnit) {
    return { success: true };
  }

  // Rankings compare % change from each person's own first weigh-in, so
  // switching units only stays correct if every past entry converts with
  // it — otherwise lbs and kg values would get mixed in the same series.
  const factor = nextUnit === "kg" ? 1 / LBS_PER_KG : LBS_PER_KG;

  // goalPercent is unit-agnostic and needs no conversion; goalWeight is a
  // raw value in the old unit, kept only so Settings can redisplay it.
  const goalWeight = user.goalWeight == null ? null : Math.round(user.goalWeight * factor * 100) / 100;

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "WeighIn" SET weight = ROUND((weight * ${factor})::numeric, 2)::float8 WHERE "userId" = ${session.userId}`,
    prisma.user.update({ where: { id: session.userId }, data: { unit: nextUnit, goalWeight } }),
  ]);

  revalidatePath("/", "layout");

  return { success: true };
}

export type UpdatePrivacyFormState = {
  success?: boolean;
} | undefined;

export async function updatePrivacyAction(
  _prevState: UpdatePrivacyFormState,
  formData: FormData
): Promise<UpdatePrivacyFormState> {
  const session = await verifySession();
  const hideWeight = formData.get("hideWeight") === "on";

  await prisma.user.update({
    where: { id: session.userId },
    data: { hideWeight },
  });

  revalidatePath("/leaderboard");

  return { success: true };
}

export type UpdateGoalFormState = {
  error?: string;
  success?: boolean;
  newBadges?: string[];
} | undefined;

const GoalModeSchema = z.enum(["percent", "weight"]);

const GoalValueSchema = z.coerce
  .number({ error: "Enter a valid number." })
  .positive("Goal must be greater than 0.");

export async function updateGoalAction(
  _prevState: UpdateGoalFormState,
  formData: FormData
): Promise<UpdateGoalFormState> {
  const session = await verifySession();
  const raw = formData.get("goalValue");
  const rawStr = typeof raw === "string" ? raw.trim() : "";

  // Empty input clears the goal entirely, regardless of mode.
  if (rawStr === "") {
    await prisma.user.update({
      where: { id: session.userId },
      data: { goalPercent: null, goalWeight: null },
    });
    revalidatePath("/leaderboard");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const modeParsed = GoalModeSchema.safeParse(formData.get("goalMode"));
  const mode = modeParsed.success ? modeParsed.data : "percent";

  const valueParsed = GoalValueSchema.safeParse(rawStr);
  if (!valueParsed.success) {
    return { error: valueParsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const value = valueParsed.data;

  let goalPercent: number;
  let goalWeight: number | null = null;

  if (mode === "weight") {
    const first = await prisma.weighIn.findFirst({
      where: { userId: session.userId },
      orderBy: { date: "asc" },
      select: { weight: true },
    });
    if (!first) {
      return { error: "Log a weigh-in first, then set a target weight." };
    }
    if (value >= first.weight) {
      return { error: "Target weight should be less than your starting weight." };
    }
    goalPercent = ((first.weight - value) / first.weight) * 100;
    goalWeight = value;
  } else {
    if (value > 100) {
      return { error: "That doesn't look like a valid goal." };
    }
    goalPercent = value;
  }

  await prisma.user.update({ where: { id: session.userId }, data: { goalPercent, goalWeight } });
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");

  // Check goal-met immediately too — if the user already exceeds a goal
  // they've just (re)set (e.g. lowering it below what they've already
  // lost), they shouldn't have to wait for their next weigh-in to get it.
  const weighIns = await prisma.weighIn.findMany({
    where: { userId: session.userId },
    orderBy: { date: "asc" },
    select: { date: true, weight: true },
  });

  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    markSetGoal: true,
    goalPercent,
    afterWeighIn: buildAfterWeighInContext(weighIns),
  });

  return { success: true, newBadges: newBadges.map((b) => b.id) };
}
