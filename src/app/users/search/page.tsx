import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { UsersSearchView } from "@/features/users/components/users-search-view";

export default function UsersSearchPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <AppHeader />
      </div>
      <UsersSearchView />
      <BottomNavigation />
    </main>
  );
}
