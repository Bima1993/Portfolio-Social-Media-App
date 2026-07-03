"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

import { formatRelativeTime } from "@/lib/date";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

import { LikesDialog } from "./likes-dialog";
import { usePostActions } from "./use-post-actions";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const [likesOpen, setLikesOpen] = useState(false);
  const caption = post.caption?.trim();
  const { isLikePending, isSavePending, savedByMe, toggleLike, toggleSave } = usePostActions(post);

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
                disabled={isLikePending}
                onClick={toggleLike}
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
            disabled={isSavePending}
            onClick={toggleSave}
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
