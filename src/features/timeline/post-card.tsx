"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { likePost, savePost, unlikePost, unsavePost } from "@/features/social/api";
import { formatRelativeTime } from "@/lib/date";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import { LikesDialog } from "./likes-dialog";
import { updateTimelinePostQueries, type TimelineInfiniteData } from "./timeline-cache";

type PostCardProps = {
  post: Post;
};

type TimelineSnapshot = Array<[QueryKey, TimelineInfiniteData | undefined]>;

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [likesOpen, setLikesOpen] = useState(false);
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = Boolean(token);
  const caption = post.caption?.trim();
  const savedByMe = Boolean(post.savedByMe);

  const likeMutation = useMutation({
    mutationFn: ({ nextLiked }: { nextLiked: boolean }) =>
      nextLiked ? likePost(post.id) : unlikePost(post.id),
    onMutate: async ({ nextLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["timeline"] });

      const previousTimeline = queryClient.getQueriesData<TimelineInfiniteData>({ queryKey: ["timeline"] });

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        likeCount: Math.max(0, currentPost.likeCount + (nextLiked ? 1 : -1)),
        likedByMe: nextLiked,
      }));

      return { previousTimeline };
    },
    onError: (_error, _variables, context) => {
      restoreTimelineSnapshot(queryClient, context?.previousTimeline);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ nextSaved }: { nextSaved: boolean }) =>
      nextSaved ? savePost(post.id) : unsavePost(post.id),
    onMutate: async ({ nextSaved }) => {
      await queryClient.cancelQueries({ queryKey: ["timeline"] });

      const previousTimeline = queryClient.getQueriesData<TimelineInfiniteData>({ queryKey: ["timeline"] });

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        savedByMe: nextSaved,
      }));

      return { previousTimeline };
    },
    onError: (_error, _variables, context) => {
      restoreTimelineSnapshot(queryClient, context?.previousTimeline);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["timeline"] });
    },
  });

  function requireAuthentication() {
    if (isAuthenticated) {
      return true;
    }

    router.push("/login");
    return false;
  }

  function handleLikeClick() {
    if (!requireAuthentication() || likeMutation.isPending) {
      return;
    }

    likeMutation.mutate({ nextLiked: !post.likedByMe });
  }

  function handleSaveClick() {
    if (!requireAuthentication() || saveMutation.isPending) {
      return;
    }

    saveMutation.mutate({ nextSaved: !savedByMe });
  }

  return (
    <>
      <article className="border-b border-border pb-8">
        <header className="mb-3 flex items-center gap-3">
          <Link
            className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted"
            href={`/profile/${post.author.username}`}
          >
            <Image
              alt={post.author.name}
              className="object-cover"
              fill
              sizes="48px"
              src={post.author.avatarUrl ?? "/globe.svg"}
            />
          </Link>
          <div className="min-w-0">
            <Link
              className="block truncate text-base font-bold text-foreground"
              href={`/profile/${post.author.username}`}
            >
              {post.author.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted-foreground">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </header>

        <Link className="relative block aspect-square overflow-hidden rounded-lg bg-secondary" href={`/posts/${post.id}`}>
          <Image
            alt={post.caption ?? "Sociality post image"}
            className="object-cover"
            fill
            priority={post.id === 1}
            sizes="(max-width: 640px) calc(100vw - 32px), 600px"
            src={post.imageUrl}
          />
        </Link>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                aria-label={post.likedByMe ? "Unlike post" : "Like post"}
                className="transition-colors hover:text-[#d51b62] disabled:opacity-60"
                disabled={likeMutation.isPending}
                onClick={handleLikeClick}
                type="button"
              >
                <Heart className={cn("size-6", post.likedByMe && "fill-[#d51b62] text-[#d51b62]")} />
              </button>
              <button
                aria-label="View likes"
                className="text-sm font-semibold transition-colors hover:text-primary"
                onClick={() => setLikesOpen(true)}
                type="button"
              >
                {post.likeCount}
              </button>
            </div>
            <Link
              aria-label="View comments"
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
              href={`/posts/${post.id}`}
            >
              <MessageCircle className="size-6" />
              {post.commentCount}
            </Link>
            <button
              className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
              type="button"
              aria-label="Share post"
            >
              <Send className="size-6" />
              20
            </button>
          </div>

          <button
            aria-label={savedByMe ? "Unsave post" : "Save post"}
            className="transition-colors hover:text-primary disabled:opacity-60"
            disabled={saveMutation.isPending}
            onClick={handleSaveClick}
            type="button"
          >
            <Bookmark className={cn("size-7", savedByMe && "fill-foreground")} />
          </button>
        </div>

        <div className="mt-4 space-y-2 text-[15px] leading-7">
          <Link className="block font-bold" href={`/profile/${post.author.username}`}>
            {post.author.name}
          </Link>
          {caption ? <p className="break-words text-foreground">{caption}</p> : null}
          {caption && caption.length > 80 ? (
            <button className="text-base font-semibold text-primary" type="button">
              Show More
            </button>
          ) : null}
        </div>
      </article>

      <LikesDialog onOpenChange={setLikesOpen} open={likesOpen} postId={post.id} />
    </>
  );
}

function restoreTimelineSnapshot(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: TimelineSnapshot | undefined,
) {
  snapshot?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}
