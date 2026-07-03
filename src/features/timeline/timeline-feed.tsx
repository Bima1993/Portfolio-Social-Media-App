"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getExplorePosts } from "@/features/posts/api";
import { POST_SUCCESS_STORAGE_KEY } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store/hooks";

import { getNextTimelinePageParam, getTimelinePosts } from "./timeline-data";
import { PostCard } from "./post-card";

const TIMELINE_PAGE_SIZE = 10;

export function TimelineFeed() {
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
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
    queryKey: queryKeys.timeline.list("explore-posts"),
    queryFn: ({ pageParam }) => getExplorePosts(Number(pageParam), TIMELINE_PAGE_SIZE),
    enabled: hydrated,
    initialPageParam: 1,
    getNextPageParam: getNextTimelinePageParam,
  });

  const posts = data?.pages.flatMap(getTimelinePosts) ?? [];

  useEffect(() => {
    if (window.sessionStorage.getItem(POST_SUCCESS_STORAGE_KEY) !== "1") {
      return;
    }

    window.sessionStorage.removeItem(POST_SUCCESS_STORAGE_KEY);

    const showTimeoutId = window.setTimeout(() => {
      setShowPostSuccess(true);
    }, 0);
    const timeoutId = window.setTimeout(() => {
      setShowPostSuccess(false);
    }, 5000);

    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-[632px] px-4 pb-28 pt-4 sm:pt-8 lg:pb-16 lg:pt-10">
      {showPostSuccess ? <PostSuccessToast onClose={() => setShowPostSuccess(false)} /> : null}

      {isPending ? <TimelineSkeleton /> : null}

      {isError ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-5 text-center">
          <h2 className="text-base font-bold">Unable to load timeline</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {error instanceof Error ? error.message : "Please try again in a moment."}
          </p>
          <Button className="mt-4 rounded-full" onClick={() => refetch()} type="button">
            Retry
          </Button>
        </div>
      ) : null}

      {!isPending && !isError && posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
          <h2 className="text-lg font-bold">No posts yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            New posts will appear here when they are available.
          </p>
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="grid gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : null}

      {hasNextPage ? (
        <div className="mt-8 flex justify-center">
          <Button
            className="h-11 rounded-full px-6"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            type="button"
          >
            {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
            {isFetchingNextPage ? "Loading" : "Load More"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function PostSuccessToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed left-4 right-4 top-[86px] z-[70] flex h-10 items-center justify-between rounded-lg bg-[#0f9f59] px-4 text-sm font-bold text-white shadow-xl shadow-black/30 sm:left-auto sm:right-6 sm:w-[292px] lg:right-24 lg:top-28">
      <span>Success Post</span>
      <button
        aria-label="Close success post notification"
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        onClick={onClose}
        type="button"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <article className="border-b border-border pb-8" key={index}>
          <div className="mb-3 flex items-center gap-3">
            <div className="size-12 animate-pulse rounded-full bg-secondary" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded-full bg-secondary" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-secondary" />
            </div>
          </div>
          <div className="aspect-square animate-pulse rounded-lg bg-secondary" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded-full bg-secondary" />
            <div className="h-4 w-full animate-pulse rounded-full bg-secondary" />
          </div>
        </article>
      ))}
    </div>
  );
}
