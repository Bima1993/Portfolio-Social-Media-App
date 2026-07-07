import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { TimelineFeed } from "@/features/timeline/timeline-feed";

export const metadata: Metadata = {
  title: "Feed | Sociality",
  description: "See posts from people you follow on Sociality.",
};

export default function FeedPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <TimelineFeed />
        <BottomNavigation />
      </main>
    </AuthGuard>
  );
}
