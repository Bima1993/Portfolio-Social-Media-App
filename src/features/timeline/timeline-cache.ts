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

type PostCollectionKey = (typeof POST_COLLECTION_KEYS)[number] | null;

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
    const items = collection.items.map((item) => {
      const post = getPostFromCollectionItem(item);

      if (!post) {
        return item;
      }

      if (post.id !== postId) {
        return item;
      }

      pageChanged = true;
      return updateCollectionItemPost(item, updatePost(post));
    });

    if (!pageChanged) {
      return page;
    }

    changed = true;
    return {
      ...page,
      data: updatePageDataCollection(pageData, collection.key, items) as PaginatedPosts,
    };
  });

  return changed ? { ...data, pages } : data;
}

export function removePostFromTimelineData(data: TimelineInfiniteData | undefined, postId: Post["id"]) {
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

    const items = collection.items.filter((item) => getPostFromCollectionItem(item)?.id !== postId);

    if (items.length === collection.items.length) {
      return page;
    }

    changed = true;
    return {
      ...page,
      data: updatePageDataCollection(pageData, collection.key, items) as PaginatedPosts,
    };
  });

  return changed ? { ...data, pages } : data;
}

export function updateTimelinePostQueries(
  queryClient: QueryClient,
  postId: Post["id"],
  updatePost: (post: Post) => Post,
) {
  queryClient.setQueryData<ApiResponse<Post>>(queryKeys.posts.detail(postId), (data) => {
    if (!data) {
      return data;
    }

    return {
      ...data,
      data: updatePost(data.data),
    };
  });
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.timeline.all }, (data) =>
    updatePostInTimelineData(data, postId, updatePost),
  );
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.profilePosts.all }, (data) =>
    updatePostInTimelineData(data, postId, updatePost),
  );
}

export function removePostFromPostQueries(queryClient: QueryClient, postId: Post["id"]) {
  queryClient.removeQueries({ queryKey: queryKeys.posts.detail(postId) });
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.timeline.all }, (data) =>
    removePostFromTimelineData(data, postId),
  );
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.profilePosts.all }, (data) =>
    removePostFromTimelineData(data, postId),
  );
}

function getPostCollection(payload: unknown) {
  if (Array.isArray(payload)) {
    return { key: null, items: payload };
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of POST_COLLECTION_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return { key, items: value };
    }
  }

  return null;
}

function updatePageDataCollection(payload: unknown, key: PostCollectionKey, items: unknown[]) {
  if (key === null) {
    return items;
  }

  return {
    ...(isRecord(payload) ? payload : {}),
    [key]: items,
  };
}

function getPostFromCollectionItem(item: unknown): Post | null {
  if (isPostLike(item)) {
    return item;
  }

  if (!isRecord(item)) {
    return null;
  }

  if (isPostLike(item.post)) {
    return item.post;
  }

  if (isPostLike(item.savedPost)) {
    return item.savedPost;
  }

  if (isPostLike(item.likedPost)) {
    return item.likedPost;
  }

  return null;
}

function updateCollectionItemPost(item: unknown, post: Post) {
  if (!isRecord(item)) {
    return post;
  }

  if (isPostLike(item.post)) {
    return { ...item, post };
  }

  if (isPostLike(item.savedPost)) {
    return { ...item, savedPost: post };
  }

  if (isPostLike(item.likedPost)) {
    return { ...item, likedPost: post };
  }

  return post;
}

function isPostLike(value: unknown): value is Post {
  return isRecord(value) && value.id !== undefined && value.id !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
