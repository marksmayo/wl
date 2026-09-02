import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-white/20 hover:text-foreground"
      >
        Log out
      </button>
    </form>
  );
}
