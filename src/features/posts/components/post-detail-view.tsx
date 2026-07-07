"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CommentsSection } from "@/features/comments/components/comments-section";
import { formatRelativeTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import type { Post } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { useAppSelector } from "@/store/hooks";

import { getPost } from "../api";
import { useDeletePost } from "../use-delete-post";
import { PostActionsBar } from "./post-actions-bar";

type PostDetailViewProps = {
  postId: string;
};

export function PostDetailView({ postId }: PostDetailViewProps) {
  const postQuery = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => getPost(postId),
  });

  return (
    <>
      <PostDetailMobileHeader />
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-44 pt-6 lg:pb-40 lg:pt-10">
        <header className="mb-8 hidden items-center gap-4 lg:flex">
          <Link
            aria-label="Back to timeline"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
            href="/"
          >
            <ArrowLeft className="size-7" />
          </Link>
          <h1 className="text-2xl font-bold">Post</h1>
        </header>

        {postQuery.isPending ? <PostDetailSkeleton /> : null}

        {postQuery.isError ? (
          <div className="mx-auto max-w-[560px] rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <h1 className="text-lg font-bold">Unable to load post</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {postQuery.error instanceof Error ? postQuery.error.message : "Please try again in a moment."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => postQuery.refetch()} type="button">
              Retry
            </Button>
          </div>
        ) : null}

        {postQuery.data?.data ? <PostDetailContent post={postQuery.data.data} /> : null}
      </section>
    </>
  );
}

function PostDetailContent({ post }: { post: Post }) {
  const router = useRouter();
  const viewer = useAppSelector((state) => state.auth.user);
  const caption = post.caption?.trim();
  const canManagePost = isSameUser(viewer, post.author);
  const deletePostMutation = useDeletePost({
    onSuccess: () => router.push("/"),
  });
  const isDeletingPost = deletePostMutation.isDeletingPost && deletePostMutation.deletingPostId === post.id;

  function handleDeletePost() {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    deletePostMutation.deletePost(post.id);
  }

  return (
    <article className="grid overflow-hidden rounded-none border-border bg-background lg:grid-cols-[minmax(0,720px)_minmax(360px,480px)] lg:rounded-lg lg:border lg:bg-secondary">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary lg:rounded-none">
        <Image
          alt={caption ?? "Sociality post image"}
          className="object-cover"
          fill
          priority
          sizes="(max-width: 1024px) calc(100vw - 32px), 720px"
          src={post.imageUrl}
        />
      </div>

      <CommentsSection
        className="lg:max-h-[720px]"
        composerInputShellClassName="bg-secondary lg:bg-background"
        footer={<PostActionsBar post={post} />}
        footerClassName="lg:px-6"
        header={
          <PostDetailSummary
            canManagePost={canManagePost}
            caption={caption}
            isDeletingPost={isDeletingPost}
            onDeletePost={handleDeletePost}
            post={post}
          />
        }
        post={post}
        scrollClassName="py-5 lg:px-6"
      />
    </article>
  );
}

function PostDetailSummary({
  canManagePost,
  caption,
  isDeletingPost,
  onDeletePost,
  post,
}: {
  canManagePost: boolean;
  caption: string | undefined;
  isDeletingPost: boolean;
  onDeletePost: () => void;
  post: Post;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <Link
          className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted"
          href={`/profile/${post.author.username}`}
        >
          <Image
            alt={post.author.name}
            className="object-cover"
            fill
            sizes="44px"
            src={post.author.avatarUrl ?? "/globe.svg"}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link className="block truncate text-base font-bold" href={`/profile/${post.author.username}`}>
            {post.author.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
        </div>
        {canManagePost ? (
          <button
            aria-label="Delete post"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-[#d51b62] disabled:opacity-60"
            disabled={isDeletingPost}
            onClick={onDeletePost}
            type="button"
          >
            {isDeletingPost ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
          </button>
        ) : null}
      </div>

      {caption ? <p className="mt-5 break-words text-sm leading-7 text-foreground">{caption}</p> : null}
    </div>
  );
}

function PostDetailMobileHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const viewerName = user?.name ?? user?.username ?? "Profile";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <Link
          aria-label="Back to timeline"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          href="/"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-lg font-bold">Post</h1>
      </div>

      <Link
        aria-label="Open profile"
        className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-foreground"
        href="/me"
      >
        {user?.avatarUrl ? (
          <Image alt={viewerName} className="size-full object-cover" height={40} src={user.avatarUrl} width={40} />
        ) : (
          <UserRound className="size-5" />
        )}
      </Link>
    </header>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-lg border border-border bg-secondary lg:grid-cols-[minmax(0,720px)_minmax(360px,480px)]">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="size-11 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
        <CommentsSkeleton />
      </div>
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <div className="mt-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="flex items-start gap-3 border-b border-border py-4" key={index}>
          <div className="size-10 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
