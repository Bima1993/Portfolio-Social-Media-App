"use client";

import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

import { usePostActions } from "../use-post-actions";

type PostActionsBarProps = {
  className?: string;
  onCommentsClick?: () => void;
  onLikesClick?: () => void;
  post: Post;
  shareCount?: number;
};

export function PostActionsBar({
  className,
  onCommentsClick,
  onLikesClick,
  post,
  shareCount = 20,
}: PostActionsBarProps) {
  const { isLikePending, isSavePending, savedByMe, toggleLike, toggleSave } = usePostActions(post);

  return (
    <div className={cn("flex items-center justify-between", className)}>
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
          {onLikesClick ? (
            <button
              aria-label="View likes"
              className="text-sm font-semibold transition-colors hover:text-primary"
              onClick={onLikesClick}
              type="button"
            >
              {post.likeCount}
            </button>
          ) : (
            <span className="text-sm font-semibold">{post.likeCount}</span>
          )}
        </div>

        {onCommentsClick ? (
          <button
            aria-label="View comments"
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
            onClick={onCommentsClick}
            type="button"
          >
            <MessageCircle className="size-6" />
            {post.commentCount}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="size-6" />
            {post.commentCount}
          </div>
        )}

        <button
          aria-label="Share post"
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
          type="button"
        >
          <Send className="size-6" />
          {shareCount}
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
  );
}
