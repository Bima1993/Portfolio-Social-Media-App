"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Heart, Loader2, MessageCircle, Send, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { createComment, deleteComment, getComments } from "@/features/social/api";
import {
  getNextCommentsPageParam,
  getPostComments,
  removeCommentFromCommentsData,
  type CommentsInfiniteData,
} from "@/features/timeline/comments-data";
import { updateTimelinePostQueries } from "@/features/timeline/timeline-cache";
import { usePostActions } from "@/features/timeline/use-post-actions";
import { formatRelativeTime } from "@/lib/date";
import { queryKeys } from "@/lib/query-keys";
import type { Comment, Post } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import { getPost } from "../api";
import { useDeletePost } from "../use-delete-post";

type PostDetailViewProps = {
  postId: string;
};

const COMMENTS_PAGE_SIZE = 10;

export function PostDetailView({ postId }: PostDetailViewProps) {
  const postQuery = useQuery({
    queryKey: queryKeys.posts.detail(postId),
    queryFn: () => getPost(postId),
  });

  return (
    <>
      <PostDetailMobileHeader />
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 lg:pb-20 lg:pt-10">
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
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { token, user: viewer } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(token);
  const [commentText, setCommentText] = useState("");
  const commentsQueryKey = queryKeys.postComments.list(post.id);
  const caption = post.caption?.trim();
  const trimmedComment = commentText.trim();
  const canManagePost = isSameUser(viewer, post.author);
  const { isLikePending, isSavePending, savedByMe, toggleLike, toggleSave } = usePostActions(post);
  const deletePostMutation = useDeletePost({
    onSuccess: () => router.push("/"),
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam }) => getComments(post.id, Number(pageParam), COMMENTS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: getNextCommentsPageParam,
  });

  const createCommentMutation = useMutation({
    mutationFn: (text: string) => createComment(post.id, text),
    onSuccess: () => {
      setCommentText("");
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
  const isDeletingPost = deletePostMutation.isDeletingPost && deletePostMutation.deletingPostId === post.id;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!canSubmit) {
      return;
    }

    createCommentMutation.mutate(trimmedComment);
  }

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

      <div className="flex min-h-0 flex-col lg:max-h-[720px]">
        <div className="min-h-0 flex-1 overflow-y-auto py-5 lg:px-6">
          <div className="flex items-start gap-3">
            <Link className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted" href={`/profile/${post.author.username}`}>
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
                onClick={handleDeletePost}
                type="button"
              >
                {isDeletingPost ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
              </button>
            ) : null}
          </div>

          {caption ? <p className="mt-5 break-words text-sm leading-7 text-foreground">{caption}</p> : null}

          <section className="mt-6 border-t border-border pt-5">
            <h2 className="text-lg font-bold">Comments</h2>

            {commentsQuery.isPending ? <CommentsSkeleton /> : null}

            {commentsQuery.isError ? (
              <div className="mt-4 rounded-lg border border-border bg-background/50 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {commentsQuery.error instanceof Error ? commentsQuery.error.message : "Unable to load comments."}
                </p>
                <Button className="mt-4 h-10 rounded-full px-5" onClick={() => commentsQuery.refetch()} type="button">
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
              <div className="mt-1 grid gap-0">
                {comments.map((comment) => (
                  <PostDetailCommentRow
                    canDelete={isSameUser(viewer, comment.author)}
                    comment={comment}
                    isDeleting={deleteCommentMutation.isPending && deleteCommentMutation.variables === comment.id}
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
          </section>
        </div>

        <div className="border-t border-border py-4 lg:px-6">
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

          <form className="flex h-12 items-center rounded-lg border border-border bg-secondary focus-within:border-primary lg:bg-background" onSubmit={handleSubmit}>
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
          </form>
        </div>
      </div>
    </article>
  );
}

function PostDetailCommentRow({
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
