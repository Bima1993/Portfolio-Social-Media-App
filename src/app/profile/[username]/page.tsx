import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ProfileView } from "@/features/profile/components/profile-view";

type PublicProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;

  return {
    title: `${username} | Sociality`,
    description: `View ${username}'s Sociality profile.`,
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <AppHeader />
      </div>
      <ProfileView mode="public" username={username} />
      <BottomNavigation />
    </main>
  );
}
