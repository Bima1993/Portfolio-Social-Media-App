"use client";

import { Home, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const isHome = pathname === "/" || pathname === "/feed";
  const isProfile = pathname === "/me" || pathname.startsWith("/profile/");

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY > 24);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [pathname]);

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-x-0 bottom-4 z-40 mx-auto flex h-16 w-[calc(100%-32px)] max-w-[360px] items-center justify-between rounded-full border border-border bg-secondary/95 px-9 shadow-2xl shadow-black/40 backdrop-blur transition-all duration-300 ease-out sm:bottom-6 lg:bottom-8 motion-reduce:transition-none",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-6 opacity-0",
      )}
    >
      <Link
        aria-current={isHome ? "page" : undefined}
        className={cn(
          "flex min-w-14 flex-col items-center justify-center gap-1 text-xs font-semibold",
          isHome ? "text-primary" : "text-foreground",
        )}
        href="/"
      >
        <Home className={cn("size-5", isHome && "fill-primary")} />
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
        aria-current={isProfile ? "page" : undefined}
        className={cn(
          "flex min-w-14 flex-col items-center justify-center gap-1 text-xs font-semibold",
          isProfile ? "text-primary" : "text-foreground",
        )}
        href="/me"
      >
        <UserRound className={cn("size-5", isProfile && "fill-primary")} />
        Profile
      </Link>
    </nav>
  );
}
