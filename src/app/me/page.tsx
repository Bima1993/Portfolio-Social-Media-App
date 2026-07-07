import type { Metadata } from "next";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ProfileView } from "@/features/profile/components/profile-view";

export const metadata: Metadata = {
  title: "My Profile | Sociality",
  description: "View your Sociality profile, gallery, liked posts, and saved posts.",
};

export default function MePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <div className="hidden lg:block">
          <AppHeader />
        </div>
        <ProfileView mode="me" />
        <BottomNavigation />
      </main>
    </AuthGuard>
  );
}
