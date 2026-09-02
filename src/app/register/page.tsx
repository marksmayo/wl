import Link from "next/link";
import { RegisterForm } from "@/components/RegisterForm";
import { AnimatedIn } from "@/components/AnimatedIn";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <AnimatedIn className="w-full max-w-md">
        <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-semibold tracking-tight">Join the competition</h1>
          <p className="mt-1 text-sm text-muted">
            Sep 4 – Dec 15. Log your weight daily and climb the board.
          </p>
          <div className="mt-8">
            <RegisterForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Already registered?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Log in
            </Link>
          </p>
        </div>
      </AnimatedIn>
    </main>
  );
}
