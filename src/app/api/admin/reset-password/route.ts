import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Admin action: reset a competitor's password when they're locked out (e.g.
// they forgot it and can't register again, since fullName is unique). Same
// auth pattern as /api/admin/backfill-badges — trigger with:
//   curl -X POST https://<your-deployment>/api/admin/reset-password \
//     -H "Authorization: Bearer $ADMIN_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"fullName": "Nick Roberts", "newPassword": "nicknick"}'
const ResetPasswordSchema = z.object({
  fullName: z.string().trim().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not configured on this deployment." },
      { status: 500 }
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ResetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { fullName, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { fullName } });
  if (!user) {
    return NextResponse.json({ error: `No user found named "${fullName}".` }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ success: true, fullName: user.fullName });
}
