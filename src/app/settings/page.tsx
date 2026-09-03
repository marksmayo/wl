import { getCurrentUser } from "@/lib/dal";
import { EditNameForm } from "@/components/EditNameForm";
import { EditUnitForm } from "@/components/EditUnitForm";
import { AnimatedIn, AnimatedStagger } from "@/components/AnimatedIn";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <AnimatedIn>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Update how you appear on the leaderboard.</p>
      </AnimatedIn>

      <AnimatedStagger className="mt-8 flex flex-col gap-6" itemSelector=".settings-card">
        <div className="settings-card glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Your name</h2>
          <div className="mt-4">
            <EditNameForm currentName={user.fullName} />
          </div>
        </div>

        <div className="settings-card glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Preferred unit</h2>
          <div className="mt-4">
            <EditUnitForm currentUnit={user.unit} />
          </div>
        </div>
      </AnimatedStagger>
    </main>
  );
}
