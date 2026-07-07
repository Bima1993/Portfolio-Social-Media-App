"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Compass, Loader2, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getFeed } from "@/features/feed/api";
import { getExplorePosts } from "@/features/posts/api";
import { POST_SUCCESS_STORAGE_KEY } from "@/lib/constants";
import { queryKeys, type TimelineSource } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import { getNextTimelinePageParam, getTimelinePosts } from "./timeline-data";
import { PostCard } from "./post-card";

const TIMELINE_PAGE_SIZE = 10;

export function TimelineFeed() {
  const router = useRouter();
  const [showPostSuccess, setShowPostSuccess] = useState(false);
  const [timelineSource, setTimelineSource] = useState<TimelineSource>("feed");
  const { hydrated, token } = useAppSelector((state) => state.auth);
  const isAuthenticated = hydrated && Boolean(token);
  const activeTimelineSource: TimelineSource = isAuthenticated ? timelineSource : "explore-posts";
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
    queryKey: queryKeys.timeline.list(activeTimelineSource),
    queryFn: ({ pageParam }) =>
      activeTimelineSource === "feed"
        ? getFeed(Number(pageParam), TIMELINE_PAGE_SIZE)
        : getExplorePosts(Number(pageParam), TIMELINE_PAGE_SIZE),
    enabled: hydrated,
    initialPageParam: 1,
    getNextPageParam: getNextTimelinePageParam,
  });

  const posts = data?.pages.flatMap(getTimelinePosts) ?? [];
  const feedLabel = activeTimelineSource === "feed" ? "following feed" : "explore feed";

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
    <section className="mx-auto w-full max-w-[632px] px-4 pb-44 pt-4 sm:pt-8 lg:pb-40 lg:pt-10">
      {showPostSuccess ? <PostSuccessToast onClose={() => setShowPostSuccess(false)} /> : null}

      <FeedSourcePanel
        activeSource={activeTimelineSource}
        isAuthenticated={isAuthenticated}
        onSourceChange={(nextSource) => {
          if (nextSource === "feed" && !isAuthenticated) {
            router.push("/login");
            return;
          }

          setTimelineSource(nextSource);
        }}
      />

      {isPending ? <TimelineSkeleton /> : null}

      {isError ? (
        <div className="rounded-lg border border-border bg-secondary/40 p-5 text-center">
          <h2 className="text-base font-bold">Unable to load {feedLabel}</h2>
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
          <h2 className="text-lg font-bold">
            {activeTimelineSource === "feed" ? "Your following feed is quiet" : "No explore posts yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeTimelineSource === "feed"
              ? "Follow more people or create your first post to start filling this timeline."
              : "New posts will appear here when they are available."}
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
        <div className="mb-8 mt-8 flex justify-center lg:mb-10">
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

function FeedSourcePanel({
  activeSource,
  isAuthenticated,
  onSourceChange,
}: {
  activeSource: TimelineSource;
  isAuthenticated: boolean;
  onSourceChange: (source: TimelineSource) => void;
}) {
  const items = [
    {
      description: "Posts from accounts you follow",
      icon: UsersRound,
      label: "Following",
      value: "feed" satisfies TimelineSource,
    },
    {
      description: "Discover public posts",
      icon: Compass,
      label: "Explore",
      value: "explore-posts" satisfies TimelineSource,
    },
  ] as const;

  return (
    <div className="mb-6 rounded-lg border border-border bg-secondary/60 p-1.5 shadow-xl shadow-black/20 backdrop-blur">
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeSource === item.value;

          return (
            <button
              aria-pressed={selected}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-md px-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-primary text-primary-foreground hover:bg-primary" : "text-muted-foreground",
              )}
              key={item.value}
              onClick={() => onSourceChange(item.value)}
              title={!isAuthenticated && item.value === "feed" ? "Login to see your following feed" : undefined}
              type="button"
            >
              <Icon className="size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-5 text-foreground">{item.label}</span>
                <span
                  className={cn(
                    "hidden truncate text-xs leading-5 sm:block",
                    selected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
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
