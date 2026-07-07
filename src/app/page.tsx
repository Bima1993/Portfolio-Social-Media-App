import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { TimelineFeed } from "@/features/timeline/timeline-feed";

export const metadata: Metadata = {
  title: "Sociality",
  description: "Explore public posts and discover people on Sociality.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <TimelineFeed />
      <BottomNavigation />
    </main>
  );
}
