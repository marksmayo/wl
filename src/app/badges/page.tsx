import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { AnimatedIn } from "@/components/AnimatedIn";
import { BadgeGallery } from "@/components/BadgeGallery";
import { BadgeAnnouncer } from "@/components/BadgeAnnouncer";
import { evaluateAndAwardBadges } from "@/lib/badges/evaluate";
import { detectDevice } from "@/lib/badges/device";

export default async function BadgesPage() {
  const user = await getCurrentUser();
  const device = await detectDevice();

  const newBadges = await evaluateAndAwardBadges({
    userId: user.id,
    recordVisit: true,
    device,
    markViewedOwnBadges: true,
  });

  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId: user.id },
    select: { badgeId: true, earnedAt: true },
  });

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
          <BadgeGallery earned={earnedBadges} />
        </div>
      </AnimatedIn>
    </main>
  );
}
