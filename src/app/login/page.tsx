import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";
import { AnimatedIn } from "@/components/AnimatedIn";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <AnimatedIn className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Log in to record today&apos;s weigh-in.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            New here?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </AnimatedIn>
    </main>
  );
}
