"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type AuthFormState = {
  error?: string;
} | undefined;

const RegisterSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    unit: z.enum(["lbs", "kg"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = RegisterSchema.safeParse({
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    unit: formData.get("unit") || "lbs",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { fullName, password, unit } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { fullName } });
  if (existing) {
    return { error: "That name is already registered. Try logging in instead." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { fullName, passwordHash, unit },
  });

  await createSession({ userId: user.id, fullName: user.fullName });
  redirect("/dashboard");
}

const LoginSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = LoginSchema.safeParse({
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { fullName, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { fullName } });
  if (!user) {
    return { error: "Invalid full name or password." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid full name or password." };
  }

  await createSession({ userId: user.id, fullName: user.fullName });
  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
