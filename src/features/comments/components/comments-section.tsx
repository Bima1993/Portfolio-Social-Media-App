"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Smile, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { createComment, deleteComment, getComments } from "@/features/social/api";
import { updateTimelinePostQueries } from "@/features/timeline/timeline-cache";
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
} from "../comments-data";

type CommentsSectionProps = {
  className?: string;
  composerInputShellClassName?: string;
  enabled?: boolean;
  footer?: ReactNode;
  footerClassName?: string;
  header?: ReactNode;
  onAuthRequired?: () => void;
  post: Post;
  scrollClassName?: string;
  showEmojiPicker?: boolean;
};

const COMMENTS_PAGE_SIZE = 10;
const COMMENT_EMOJIS = [
  "\u{1F600}",
  "\u{1F604}",
  "\u{1F970}",
  "\u{1F60D}",
  "\u{1F642}",
  "\u{1F60A}",
  "\u{1F61C}",
  "\u{1F92D}",
  "\u{1F917}",
  "\u{1F60C}",
  "\u{1F62A}",
  "\u{1F644}",
  "\u{1F92B}",
  "\u{1F634}",
  "\u{1F975}",
  "\u{1F62B}",
  "\u{1F62D}",
  "\u{1F631}",
] as const;

export function CommentsSection({
  className,
  composerInputShellClassName,
  enabled = true,
  footer,
  footerClassName,
  header,
  onAuthRequired,
  post,
  scrollClassName,
  showEmojiPicker = false,
}: CommentsSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const viewer = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(token);
  const [commentText, setCommentText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const commentsQueryKey = queryKeys.postComments.list(post.id);
  const trimmedComment = commentText.trim();

  const commentsQuery = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam }) => getComments(post.id, Number(pageParam), COMMENTS_PAGE_SIZE),
    enabled,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
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

  const comments = commentsQuery.data?.pages.flatMap(getPostComments) ?? [];
  const canSubmit = trimmedComment.length > 0 && !createCommentMutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      onAuthRequired?.();
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

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className={cn("min-h-0 flex-1 overflow-y-auto", scrollClassName)}>
        {header}

        <section className="mt-6 border-t border-border pt-5">
          <h3 className="text-lg font-bold">Comments</h3>

          <div className="mt-4">
            {commentsQuery.isPending ? <CommentsSkeleton /> : null}

            {commentsQuery.isError ? (
              <div className="rounded-lg border border-border bg-background/50 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {commentsQuery.error instanceof Error
                    ? commentsQuery.error.message
                    : "Unable to load comments."}
                </p>
                <Button
                  className="mt-4 h-10 rounded-full px-5"
                  onClick={() => commentsQuery.refetch()}
                  type="button"
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {!commentsQuery.isPending && !commentsQuery.isError && comments.length === 0 ? (
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
                    isDeleting={
                      deleteCommentMutation.isPending &&
                      deleteCommentMutation.variables === comment.id
                    }
                    key={comment.id}
                    onDelete={() => deleteCommentMutation.mutate(comment.id)}
                  />
                ))}
              </div>
            ) : null}

            {commentsQuery.hasNextPage ? (
              <Button
                className="mt-5 h-10 w-full rounded-full"
                disabled={commentsQuery.isFetchingNextPage}
                onClick={() => commentsQuery.fetchNextPage()}
                type="button"
                variant="outline"
              >
                {commentsQuery.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
                {commentsQuery.isFetchingNextPage ? "Loading" : "Load More"}
              </Button>
            ) : null}
          </div>
        </section>
      </div>

      <div className={cn("border-t border-border py-4", footerClassName)}>
        {footer ? <div className="mb-4">{footer}</div> : null}

        <form className="relative flex items-center gap-2" onSubmit={handleSubmit}>
          {showEmojiPicker && emojiOpen ? (
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

          {showEmojiPicker ? (
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
          ) : null}

          <div
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center rounded-lg border border-border bg-background focus-within:border-primary",
              composerInputShellClassName,
            )}
          >
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
