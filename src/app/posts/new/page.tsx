import { AppHeader } from "@/components/layout/app-header";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { CreatePostView } from "@/features/posts/components/create-post-view";

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
