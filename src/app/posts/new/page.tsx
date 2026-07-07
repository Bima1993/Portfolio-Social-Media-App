import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { CreatePostView } from "@/features/posts/components/create-post-view";

export const metadata: Metadata = {
  title: "Add Post | Sociality",
  description: "Share a new photo post on Sociality.",
};

export default function NewPostPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
        <div className="hidden lg:block">
          <AppHeader />
        </div>
        <CreatePostView />
      </main>
    </AuthGuard>
  );
}
