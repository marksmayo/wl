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
