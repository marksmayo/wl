import Link from "next/link";
import { getOptionalSession } from "@/lib/dal";
import { LogoutButton } from "@/components/LogoutButton";

export async function NavBar() {
  const session = await getOptionalSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_2px_var(--accent)]" />
          DropIt
        </Link>

        {session ? (
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Leaderboard
            </Link>
            <Link
              href="/settings"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Settings
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{session.fullName}</span>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform hover:scale-105"
            >
              Join the comp
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
