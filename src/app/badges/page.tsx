import { getCurrentUser, verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AnimatedIn } from "@/components/AnimatedIn";
import { BadgeGallery } from "@/components/BadgeGallery";
import { BadgeAnnouncer } from "@/components/BadgeAnnouncer";
import { evaluateAndAwardBadges, loadBadgeContext } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";
import { getTrophyCaseStats } from "@/lib/badges/trophyCase";

export default async function BadgesPage() {
  const session = await verifySession();
  const [user, device, badgeContext, earnedBadges, { entries: rarity }] = await Promise.all([
    getCurrentUser(),
    detectDevice(),
    loadBadgeContext(session.userId),
    prisma.userBadge.findMany({
      where: { userId: session.userId },
      select: { badgeId: true, earnedAt: true },
    }),
    getTrophyCaseStats(),
  ]);

  const newBadges = await evaluateAndAwardBadges({
    userId: user.id,
    context: badgeContext,
    recordVisit: true,
    device,
    markViewedOwnBadges: true,
  });

  // The gallery was read alongside the evaluation, so fold in anything
  // awarded on this very visit — otherwise the toast and the grid disagree.
  const justNow = new Date();
  const earned = [
    ...earnedBadges,
    ...newBadges.map((b) => ({ badgeId: b.id, earnedAt: justNow })),
  ];
  const rarityByBadgeId = new Map(rarity.map((r) => [r.id, r.percent]));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <BadgeAnnouncer badgeIds={newBadges.map((b) => b.id)} />
      <AnimatedIn>
        <h1 className="text-3xl font-semibold tracking-tight">Badges</h1>
        <p className="mt-1 text-sm text-muted">
          Every achievement you can earn while you compete — and the ones you already have.
        </p>
      </AnimatedIn>

      <AnimatedIn delay={0.1} className="mt-8">
        <div className="glass rounded-2xl p-6">
          <BadgeGallery earned={earned} rarityByBadgeId={rarityByBadgeId} />
        </div>
      </AnimatedIn>
    </main>
  );
}
