import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { EditProfileView } from "@/features/profile/components/edit-profile-view";

export const metadata: Metadata = {
  title: "Edit Profile | Sociality",
  description: "Update your Sociality profile details.",
};

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <div className="hidden lg:block">
          <AppHeader />
        </div>
        <EditProfileView />
      </main>
    </AuthGuard>
  );
}
