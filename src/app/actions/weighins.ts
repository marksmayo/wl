"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { clampToCompetitionWindow } from "@/lib/competition";

export type WeighInFormState = {
  error?: string;
  success?: boolean;
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

  const { date, weight } = parsed.data;

  if (!clampToCompetitionWindow(date)) {
    return { error: "That date is outside the competition window (Sep 4 – Dec 15)." };
  }

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

  return { success: true };
}

export async function deleteWeighInAction(dateKey: string) {
  const session = await verifySession();
  await prisma.weighIn.deleteMany({
    where: { userId: session.userId, date: new Date(`${dateKey}T00:00:00.000Z`) },
  });
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}
