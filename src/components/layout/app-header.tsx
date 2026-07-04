"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useState } from "react";

import { SocialityLogo } from "@/components/brand/sociality-logo";
import { Button } from "@/components/ui/button";
import { UserSearch } from "@/features/users/components/user-search";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { hydrated, token, user } = useAppSelector((state) => state.auth);
  const isAuthenticated = hydrated && Boolean(token);
  const viewerName = user?.name ?? user?.username ?? "Profile";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:grid lg:h-20 lg:grid-cols-[1fr_minmax(320px,490px)_1fr] lg:px-8">
        <SocialityLogo
          className="shrink-0"
          href="/"
          markClassName="size-7 lg:size-8"
          textClassName="lg:text-3xl"
        />

        <UserSearch className="hidden lg:block" />

        <button
          aria-expanded={mobileSearchOpen}
          aria-label={mobileSearchOpen ? "Close search" : "Search"}
          className="absolute right-14 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:right-16 lg:hidden"
          onClick={() => {
            setMobileSearchOpen((current) => !current);
            setMenuOpen(false);
          }}
          type="button"
        >
          {mobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
        </button>

        {isAuthenticated ? (
          <Link
            className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-4 sm:right-6 lg:static lg:translate-y-0"
            href="/me"
          >
            {user?.avatarUrl ? (
              <Image
                alt={viewerName}
                className="size-10 rounded-full object-cover lg:size-12"
                height={40}
                src={user.avatarUrl}
                width={40}
              />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground lg:size-12">
                <UserRound className="size-5 lg:size-6" />
              </span>
            )}
            <span className="hidden text-base font-bold lg:inline">{viewerName}</span>
          </Link>
        ) : (
          <>
            <div className="hidden items-center justify-end gap-3 lg:flex">
              <Button asChild className="h-11 min-w-32 rounded-full border-border text-base" variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="h-11 min-w-32 rounded-full bg-primary px-8 text-base font-bold">
                <Link href="/register">Register</Link>
              </Button>
            </div>
            <button
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:right-5 lg:hidden"
              onClick={() => {
                setMenuOpen((current) => !current);
                setMobileSearchOpen(false);
              }}
              type="button"
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-7" />}
            </button>
          </>
        )}
      </div>

      <div
        className={cn(
          "grid border-t border-border bg-background px-4 transition-[grid-template-rows] duration-200 lg:hidden",
          mobileSearchOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="py-3">
            <UserSearch onResultClick={() => setMobileSearchOpen(false)} variant="mobile" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid border-t border-border bg-background px-4 transition-[grid-template-rows] duration-200 lg:hidden",
          menuOpen && !isAuthenticated ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-3 py-3">
            <Button asChild className="h-10 rounded-full border-border bg-background text-sm font-bold" variant="outline">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </Button>
            <Button asChild className="h-10 rounded-full bg-primary text-sm font-bold">
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
