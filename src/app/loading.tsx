import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Loader2 aria-label="Loading page" className="size-7 animate-spin text-primary" />
    </main>
  );
}
