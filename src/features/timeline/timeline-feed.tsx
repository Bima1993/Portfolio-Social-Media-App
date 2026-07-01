"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getExplorePosts } from "@/features/posts/api";

import { PostCard } from "./post-card";

const TIMELINE_PAGE_SIZE = 10;

export function TimelineFeed() {
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
    queryKey: ["timeline", "explore-posts"],
    queryFn: ({ pageParam }) => getExplorePosts(pageParam, TIMELINE_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.pagination;

      return page < totalPages ? page + 1 : undefined;
    },
  });

  const posts = data?.pages.flatMap((page) => page.data.posts) ?? [];

  return (
    <section className="mx-auto w-full max-w-[632px] px-4 pb-28 pt-4 sm:pt-8 lg:pb-16 lg:pt-10">
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
