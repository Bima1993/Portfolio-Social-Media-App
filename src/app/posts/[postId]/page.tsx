import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PostDetailView } from "@/features/posts/components/post-detail-view";

type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="hidden lg:block">
        <AppHeader />
      </div>
      <PostDetailView postId={postId} />
      <BottomNavigation />
    </main>
  );
}
