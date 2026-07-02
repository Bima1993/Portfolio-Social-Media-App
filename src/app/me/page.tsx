import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { MyProfileOverview } from "@/features/profile/components/my-profile-overview";

export default function MePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <MyProfileOverview />
        <BottomNavigation />
      </main>
    </AuthGuard>
  );
}
