"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const demoViewer = {
  name: "John Doe",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
};

export function AppHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = false;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:grid lg:h-20 lg:grid-cols-[1fr_minmax(320px,490px)_1fr] lg:px-8">
        <Link className="flex w-fit shrink-0 items-center gap-3" href="/" aria-label="Sociality home">
          <span className="brand-mark size-7 lg:size-8" aria-hidden="true" />
          <span className="text-2xl font-bold tracking-[-0.01em] lg:text-3xl">Sociality</span>
        </Link>

        <label className="relative hidden lg:block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-full border-border bg-secondary pl-12 text-base text-foreground placeholder:text-muted-foreground"
            placeholder="Search"
            type="search"
          />
        </label>

        <button
          className="absolute right-14 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:right-16 lg:hidden"
          style={{ position: "fixed", right: 122, top: 12, transform: "none" }}
          type="button"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>

        {isAuthenticated ? (
          <Link className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-4 sm:right-6 lg:static lg:translate-y-0" href="/me">
            <Image
              alt={demoViewer.name}
              className="size-10 rounded-full object-cover lg:size-12"
              height={40}
              src={demoViewer.avatarUrl}
              width={40}
            />
            <span className="hidden text-base font-bold lg:inline">{demoViewer.name}</span>
          </Link>
        ) : (
          <>
            <div className="hidden items-center justify-end gap-3 lg:flex">
              <Button className="h-11 min-w-32 rounded-full border-border text-base" variant="outline">
                Login
              </Button>
              <Button className="h-11 min-w-32 rounded-full bg-primary px-8 text-base font-bold">
                Register
              </Button>
            </div>
            <button
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary sm:right-5 lg:hidden"
              style={{ position: "fixed", right: 78, top: 12, transform: "none" }}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-7" />}
            </button>
          </>
        )}
      </div>

      <div
        className={cn(
          "grid border-t border-border bg-background px-4 transition-[grid-template-rows] duration-200 lg:hidden",
          menuOpen && !isAuthenticated ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-2 gap-3 py-3">
            <Button className="h-10 rounded-full border-border bg-background text-sm font-bold" variant="outline">
              Login
            </Button>
            <Button className="h-10 rounded-full bg-primary text-sm font-bold">Register</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
