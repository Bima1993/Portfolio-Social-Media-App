import type { Metadata } from "next";

import { AppHeader } from "@/components/layout/app-header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { PostDetailView } from "@/features/posts/components/post-detail-view";

type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;

  return {
    title: `Post ${postId} | Sociality`,
    description: "View a Sociality post and its comments.",
  };
}

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
