import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedPosts, Post } from "@/lib/types";

export type TimelineInfiniteData = InfiniteData<ApiResponse<PaginatedPosts>, number>;

const POST_COLLECTION_KEYS = [
  "posts",
  "feed",
  "items",
  "results",
  "data",
  "saved",
  "savedPosts",
  "liked",
  "likedPosts",
  "userPosts",
  "myPosts",
] as const;

export function updatePostInTimelineData(
  data: TimelineInfiniteData | undefined,
  postId: Post["id"],
  updatePost: (post: Post) => Post,
) {
  if (!data) {
    return data;
  }

  let changed = false;
  const pages = data.pages.map((page) => {
    const pageData = page.data as unknown;
    const collection = getPostCollection(pageData);

    if (!collection) {
      return page;
    }

    let pageChanged = false;
    const posts = collection.posts.map((post) => {
      if (post.id !== postId) {
        return post;
      }

      pageChanged = true;
      return updatePost(post);
    });

    if (!pageChanged) {
      return page;
    }

    changed = true;
    return {
      ...page,
      data: updatePageDataCollection(pageData, collection.key, posts) as PaginatedPosts,
    };
  });

  return changed ? { ...data, pages } : data;
}

export function updateTimelinePostQueries(
  queryClient: QueryClient,
  postId: Post["id"],
  updatePost: (post: Post) => Post,
) {
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.timeline.all }, (data) =>
    updatePostInTimelineData(data, postId, updatePost),
  );
}

function getPostCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return { key: null, posts: payload.filter(isPostLike) };
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of POST_COLLECTION_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return { key, posts: value.filter(isPostLike) };
    }
  }

  return null;
}

function updatePageDataCollection(payload: unknown, key: (typeof POST_COLLECTION_KEYS)[number] | null, posts: Post[]) {
  if (key === null) {
    return posts;
  }

  return {
    ...(isRecord(payload) ? payload : {}),
    [key]: posts,
  };
}

function isPostLike(value: unknown): value is Post {
  return isRecord(value) && value.id !== undefined && value.id !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
