"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { verifySession } from "@/lib/dal";

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

  await prisma.$transaction([
    prisma.$executeRaw`UPDATE "WeighIn" SET weight = ROUND((weight * ${factor})::numeric, 1)::float8 WHERE "userId" = ${session.userId}`,
    prisma.user.update({ where: { id: session.userId }, data: { unit: nextUnit } }),
  ]);

  revalidatePath("/", "layout");

  return { success: true };
}
