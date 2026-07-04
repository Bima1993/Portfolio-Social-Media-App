"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, Loader2, MessageCircle, MoreHorizontal, Send, Smile, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/features/posts/use-delete-post";
import { createComment, deleteComment, getComments } from "@/features/social/api";
import { formatRelativeTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import type { Comment, Post } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import {
  getNextCommentsPageParam,
  getPostComments,
  removeCommentFromCommentsData,
  type CommentsInfiniteData,
} from "./comments-data";
import { updateTimelinePostQueries } from "./timeline-cache";
import { usePostActions } from "./use-post-actions";

type CommentsDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  post: Post;
};

const COMMENTS_PAGE_SIZE = 10;
const COMMENT_EMOJIS = [
  "😀",
  "😄",
  "🥰",
  "😍",
  "🙂",
  "😊",
  "😜",
  "🤭",
  "🤗",
  "😌",
  "😪",
  "🙄",
  "🤫",
  "😴",
  "🥵",
  "😫",
  "😭",
  "😱",
] as const;

export function CommentsDialog({ onOpenChange, open, post }: CommentsDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const viewer = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(token);
  const [commentText, setCommentText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const commentsQueryKey = queryKeys.postComments.list(post.id);
  const caption = post.caption?.trim();
  const trimmedComment = commentText.trim();
  const { isLikePending, isSavePending, savedByMe, toggleLike, toggleSave } = usePostActions(post);
  const deletePostMutation = useDeletePost({
    onSuccess: () => onOpenChange(false),
  });
  const canManagePost = isSameUser(viewer, post.author);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam }) => getComments(post.id, Number(pageParam), COMMENTS_PAGE_SIZE),
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: getNextCommentsPageParam,
  });

  const createCommentMutation = useMutation({
    mutationFn: (text: string) => createComment(post.id, text),
    onSuccess: () => {
      setCommentText("");
      setEmojiOpen(false);
      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        commentCount: Number(currentPost.commentCount ?? 0) + 1,
      }));
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: Comment["id"]) => deleteComment(commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (currentData) =>
        removeCommentFromCommentsData(currentData, commentId),
      );
      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        commentCount: Math.max(0, Number(currentPost.commentCount ?? 0) - 1),
      }));
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
    },
  });

  const comments = data?.pages.flatMap(getPostComments) ?? [];
  const canSubmit = trimmedComment.length > 0 && !createCommentMutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      onOpenChange(false);
      router.push("/login");
      return;
    }

    if (!canSubmit) {
      return;
    }

    createCommentMutation.mutate(trimmedComment);
  }

  function appendEmoji(emoji: string) {
    setCommentText((currentText) => `${currentText}${emoji}`);
    inputRef.current?.focus();
  }

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

          <div className="flex min-h-0 flex-col bg-secondary">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-5 sm:px-6">
              <PostSummary
                canManagePost={canManagePost}
                caption={caption}
                isDeletingPost={deletePostMutation.isDeletingPost && deletePostMutation.deletingPostId === post.id}
                onDeletePost={handleDeletePost}
                post={post}
              />

              <section className="mt-6 border-t border-border pt-5">
                <h3 className="text-lg font-bold">Comments</h3>

                <div className="mt-4">
                  {isPending ? <CommentsSkeleton /> : null}

                  {isError ? (
                    <div className="rounded-lg border border-border bg-background/50 p-5 text-center">
                      <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : "Unable to load comments."}
                      </p>
                      <Button className="mt-4 h-10 rounded-full px-5" onClick={() => refetch()} type="button">
                        Retry
                      </Button>
                    </div>
                  ) : null}

                  {!isPending && !isError && comments.length === 0 ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                      <p className="text-lg font-bold">No Comments yet</p>
                      <p className="mt-2 text-sm text-muted-foreground">Start the conversation</p>
                    </div>
                  ) : null}

                  {comments.length > 0 ? (
                    <div className="grid gap-0">
                      {comments.map((comment) => (
                        <CommentRow
                          canDelete={isSameUser(viewer, comment.author)}
                          comment={comment}
                          isDeleting={deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id}
                          key={comment.id}
                          onDelete={() => deleteCommentMutation.mutate(comment.id)}
                        />
                      ))}
                    </div>
                  ) : null}

                  {hasNextPage ? (
                    <Button
                      className="mt-5 h-10 w-full rounded-full"
                      disabled={isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                      type="button"
                      variant="outline"
                    >
                      {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
                      {isFetchingNextPage ? "Loading" : "Load More"}
                    </Button>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="border-t border-border px-5 py-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
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
                    <span className="text-sm font-semibold">{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle className="size-6" />
                    {post.commentCount}
                  </div>
                  <button
                    aria-label="Share post"
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                    type="button"
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

              <form className="relative flex items-center gap-2" onSubmit={handleSubmit}>
                {emojiOpen ? (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 z-10 grid w-[210px] grid-cols-6 gap-2 rounded-lg border border-border bg-secondary p-3 shadow-xl shadow-black/50">
                    {COMMENT_EMOJIS.map((emoji) => (
                      <button
                        aria-label={`Add ${emoji}`}
                        className="flex size-7 items-center justify-center rounded-md text-lg transition-colors hover:bg-muted"
                        key={emoji}
                        onClick={() => appendEmoji(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  aria-label="Select emoji"
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted",
                    emojiOpen && "border-primary text-primary",
                  )}
                  onClick={() => setEmojiOpen((currentOpen) => !currentOpen)}
                  type="button"
                >
                  <Smile className="size-6" />
                </button>

                <div className="flex h-12 min-w-0 flex-1 items-center rounded-lg border border-border bg-background focus-within:border-primary">
                  <input
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add Comment"
                    ref={inputRef}
                    value={commentText}
                  />
                  <button
                    className="h-full shrink-0 px-4 text-sm font-bold text-primary transition-colors disabled:text-muted-foreground"
                    disabled={!canSubmit}
                    type="submit"
                  >
                    {createCommentMutation.isPending ? "Posting" : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
        <Link className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted" href={`/profile/${post.author.username}`}>
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
          <button aria-label="More post actions" className="rounded-full p-1 transition-colors hover:bg-muted" type="button">
            <MoreHorizontal className="size-6" />
          </button>
        )}
      </div>

      {caption ? <p className="mt-4 text-sm leading-7 text-foreground">{caption}</p> : null}
    </div>
  );
}

function CommentRow({
  canDelete,
  comment,
  isDeleting,
  onDelete,
}: {
  canDelete: boolean;
  comment: Comment;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  function handleDelete() {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    onDelete();
  }

  return (
    <article className="border-b border-border py-4">
      <div className="flex items-start gap-3">
        <Link className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted" href={`/profile/${comment.author.username}`}>
          <Image
            alt={comment.author.name}
            className="object-cover"
            fill
            sizes="40px"
            src={comment.author.avatarUrl ?? "/globe.svg"}
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Link className="truncate text-sm font-bold" href={`/profile/${comment.author.username}`}>
              {comment.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-2 break-words text-sm leading-6">{comment.text}</p>
        </div>
        {canDelete ? (
          <button
            aria-label="Delete comment"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-[#d51b62] disabled:opacity-60"
            disabled={isDeleting}
            onClick={handleDelete}
            type="button"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CommentsSkeleton() {
  return (
    <div>
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
