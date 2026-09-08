import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AnimatedIn } from "@/components/AnimatedIn";
import { BadgeGallery } from "@/components/BadgeGallery";
import { BadgeAnnouncer } from "@/components/BadgeAnnouncer";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";

export default async function UserBadgesPage({ params }: PageProps<"/badges/[userId]">) {
  const session = await verifySession();
  const { userId } = await params;

  // Your own badges page already has the toast/self-heal side effects —
  // send you there instead of duplicating a read-only view of yourself.
  if (userId === session.userId) {
    redirect("/badges");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true },
  });
  if (!user) {
    notFound();
  }

  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    select: { badgeId: true, earnedAt: true },
  });

  const device = await detectDevice();
  const newBadges = await evaluateAndAwardBadges({
    userId: session.userId,
    recordVisit: true,
    device,
    markViewedOtherBadges: true,
  });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <BadgeAnnouncer badgeIds={newBadges.map((b) => b.id)} />
      <AnimatedIn>
        <Link
          href="/leaderboard"
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Back to leaderboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {user.fullName}&apos;s Badges
        </h1>
        <p className="mt-1 text-sm text-muted">
          Every achievement {user.fullName.split(" ")[0]} has earned while competing.
        </p>
      </AnimatedIn>

      <AnimatedIn delay={0.1} className="mt-8">
        <div className="glass rounded-2xl p-6">
          <BadgeGallery earned={earnedBadges} />
        </div>
      </AnimatedIn>
    </main>
  );
}
