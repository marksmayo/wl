import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/leaderboard";
import { competitionStatus, todayDateKeyInTimeZone } from "@/lib/competition";
import { sendSignalMessage } from "@/lib/signal";

// Never cached — this must re-check the roster on every invocation.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // There's no visitor to correct to for a scheduled job, so "today" is
  // resolved in a fixed timezone rather than the server's UTC — set
  // NUDGE_TIMEZONE if the group isn't NZ/most-of-Australia.
  const timeZone = process.env.NUDGE_TIMEZONE || "Pacific/Auckland";
  const todayKey = todayDateKeyInTimeZone(timeZone);

  if (competitionStatus(todayKey) !== "active") {
    return NextResponse.json({ skipped: "competition is not currently active" });
  }

  const { roster } = await getLeaderboardData();
  const missing = roster.filter((r) => !r.loggedDates.includes(todayKey));

  if (missing.length === 0) {
    return NextResponse.json({ skipped: "everyone has already logged in today" });
  }

  const names = missing.map((m) => m.fullName).join("\n• ");
  const message = `⏰ Weigh-in reminder\n\n${missing.length} ${
    missing.length === 1 ? "person hasn't" : "people haven't"
  } logged their weight today yet:\n• ${names}`;

  try {
    await sendSignalMessage(message);
  } catch (error) {
    console.error("Failed to send Signal nudge:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to send Signal message", detail }, { status: 502 });
  }

  return NextResponse.json({ sent: true, count: missing.length });
}
