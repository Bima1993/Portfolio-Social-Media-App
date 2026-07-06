"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, MoreHorizontal, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CommentsSection } from "@/features/comments/components/comments-section";
import { PostActionsBar } from "@/features/posts/components/post-actions-bar";
import { useDeletePost } from "@/features/posts/use-delete-post";
import { formatRelativeTime } from "@/lib/date";
import type { Post } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { useAppSelector } from "@/store/hooks";

type CommentsDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  post: Post;
};

export function CommentsDialog({ onOpenChange, open, post }: CommentsDialogProps) {
  const viewer = useAppSelector((state) => state.auth.user);
  const caption = post.caption?.trim();
  const deletePostMutation = useDeletePost({
    onSuccess: () => onOpenChange(false),
  });
  const canManagePost = isSameUser(viewer, post.author);

  function handleDeletePost() {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    deletePostMutation.deletePost(post.id);
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] grid h-[min(90vh,720px)] w-[calc(100vw-32px)] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 grid-rows-[42vh_minmax(0,1fr)] overflow-hidden rounded-lg border border-border bg-secondary shadow-2xl shadow-black/60 lg:grid-cols-[minmax(0,720px)_480px] lg:grid-rows-none">
          <Dialog.Close className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-background/60 text-foreground transition-colors hover:bg-secondary lg:-right-14 lg:-top-12 lg:bg-transparent">
            <X className="size-7" />
            <span className="sr-only">Close comments dialog</span>
          </Dialog.Close>

          <Dialog.Title className="sr-only">Comments</Dialog.Title>
          <Dialog.Description className="sr-only">View this post and its comments.</Dialog.Description>

          <div className="relative min-h-[260px] bg-background lg:min-h-[640px]">
            <Image
              alt={caption ?? "Sociality post image"}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) calc(100vw - 32px), 720px"
              src={post.imageUrl}
            />
          </div>

          <CommentsSection
            className="bg-secondary"
            enabled={open}
            footer={<PostActionsBar post={post} />}
            footerClassName="px-5 sm:px-6"
            header={
              <PostSummary
                canManagePost={canManagePost}
                caption={caption}
                isDeletingPost={
                  deletePostMutation.isDeletingPost && deletePostMutation.deletingPostId === post.id
                }
                onDeletePost={handleDeletePost}
                post={post}
              />
            }
            onAuthRequired={() => onOpenChange(false)}
            post={post}
            scrollClassName="px-5 pb-5 pt-5 sm:px-6"
            showEmojiPicker
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PostSummary({
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
          className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted"
          href={`/profile/${post.author.username}`}
        >
          <Image
            alt={post.author.name}
            className="object-cover"
            fill
            sizes="40px"
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
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-[#d51b62] disabled:opacity-60"
            disabled={isDeletingPost}
            onClick={onDeletePost}
            type="button"
          >
            {isDeletingPost ? <Loader2 className="size-6 animate-spin" /> : <Trash2 className="size-6" />}
          </button>
        ) : (
          <button
            aria-label="More post actions"
            className="rounded-full p-1 transition-colors hover:bg-muted"
            type="button"
          >
            <MoreHorizontal className="size-6" />
          </button>
        )}
      </div>

      {caption ? <p className="mt-4 text-sm leading-7 text-foreground">{caption}</p> : null}
    </div>
  );
}
