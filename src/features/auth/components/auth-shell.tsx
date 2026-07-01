import type { ReactNode } from "react";

import { SocialityLogo } from "@/components/brand/sociality-logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
  title: string;
};

export function AuthShell({ children, className, title }: AuthShellProps) {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-x-0 bottom-0 h-[42vh] bg-[linear-gradient(110deg,#7037f5_0%,#32116e_42%,#000000_66%,#8f54ff_100%)] opacity-95 blur-2xl" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#000000_0%,rgba(0,0,0,0.94)_46%,rgba(0,0,0,0.46)_100%)]" />

      <section className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-10">
        <div
          className={cn(
            "box-border w-[calc(100vw_-_40px)] max-w-[524px] rounded-2xl border border-border bg-black/80 px-6 py-8 shadow-2xl shadow-black/40 backdrop-blur sm:px-10 sm:py-10 lg:px-12",
            className,
          )}
        >
          <SocialityLogo className="mx-auto justify-center" markClassName="size-8" textClassName="text-2xl" />
          <h1 className="mt-7 text-center text-2xl font-bold sm:mt-8">{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
