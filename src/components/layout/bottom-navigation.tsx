import { Home, Plus, UserRound } from "lucide-react";
import Link from "next/link";

export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto flex h-16 w-[calc(100%-32px)] max-w-[360px] items-center justify-between rounded-full border border-border bg-secondary/95 px-9 shadow-2xl shadow-black/40 backdrop-blur lg:hidden">
      <Link
        className="flex min-w-14 flex-col items-center justify-center gap-1 text-xs font-semibold text-primary"
        href="/"
      >
        <Home className="size-5 fill-primary" />
        Home
      </Link>

      <Link
        className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        href="/posts/new"
        aria-label="Create post"
      >
        <Plus className="size-7" />
      </Link>

      <Link
        className="flex min-w-14 flex-col items-center justify-center gap-1 text-xs font-medium text-foreground"
        href="/me"
      >
        <UserRound className="size-5" />
        Profile
      </Link>
    </nav>
  );
}
