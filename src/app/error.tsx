"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-secondary/60 p-8 text-center shadow-2xl shadow-black/30">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {error.message || "Please try again in a moment."}
        </p>
        <Button className="mt-6 rounded-full px-6" onClick={reset} type="button">
          Try Again
        </Button>
      </section>
    </main>
  );
}
