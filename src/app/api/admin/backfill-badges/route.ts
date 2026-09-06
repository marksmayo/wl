import { NextResponse } from "next/server";
import { backfillBadges } from "@/lib/badges/backfill";

// One-time (but safely re-runnable) admin action: awards badges retroactively
// based on data that predates the badge system. Trigger with:
//   curl -X POST https://<your-deployment>/api/admin/backfill-badges \
//     -H "Authorization: Bearer $ADMIN_SECRET"
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

  const results = await backfillBadges();

  return NextResponse.json({
    usersAwarded: results.length,
    totalBadgesAwarded: results.reduce((sum, r) => sum + r.newBadges.length, 0),
    results,
  });
}
