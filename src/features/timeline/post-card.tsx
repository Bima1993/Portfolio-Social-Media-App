"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { PostActionsBar } from "@/features/posts/components/post-actions-bar";
import { useDeletePost } from "@/features/posts/use-delete-post";
import { formatRelativeTime } from "@/lib/date";
import type { Post } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { useAppSelector } from "@/store/hooks";

import { LikesDialog } from "./likes-dialog";
import { CommentsDialog } from "./comments-dialog";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const [likesOpen, setLikesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const viewer = useAppSelector((state) => state.auth.user);
  const caption = post.caption?.trim();
  const deletePostMutation = useDeletePost();
  const canManagePost = isSameUser(viewer, post.author);
  const isDeletingThisPost = deletePostMutation.isDeletingPost && deletePostMutation.deletingPostId === post.id;

  function handleDeletePost() {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    deletePostMutation.deletePost(post.id);
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
          {canManagePost ? (
            <button
              aria-label="Delete post"
              className="ml-auto flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-[#d51b62] disabled:opacity-60"
              disabled={isDeletingThisPost}
              onClick={handleDeletePost}
              type="button"
            >
              {isDeletingThisPost ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
            </button>
          ) : null}
        </header>

        <Link
          aria-label="Open post detail"
          className="relative block aspect-square w-full overflow-hidden rounded-lg bg-secondary"
          href={`/posts/${post.id}`}
        >
          <Image
            alt={post.caption ?? "Sociality post image"}
            className="object-cover"
            fill
            priority={post.id === 1}
            sizes="(max-width: 640px) calc(100vw - 32px), 600px"
            src={post.imageUrl}
          />
        </Link>

        <PostActionsBar
          className="mt-3"
          onCommentsClick={() => setCommentsOpen(true)}
          onLikesClick={() => setLikesOpen(true)}
          post={post}
        />

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
      <CommentsDialog onOpenChange={setCommentsOpen} open={commentsOpen} post={post} />
    </>
  );
}
