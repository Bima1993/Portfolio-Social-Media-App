"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateProfileStatQueries } from "@/features/profile/profile-stats";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Post, UserProfile } from "@/lib/types";

import { deletePost as deletePostRequest } from "./api";
import { removePostFromPostQueries, type TimelineInfiniteData } from "../timeline/timeline-cache";

type DeletePostOptions = {
  onSuccess?: (postId: Post["id"]) => void;
};

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

export function useDeletePost(options?: DeletePostOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (postId: Post["id"]) => deletePostRequest(postId),
    onMutate: async (postId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.timeline.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.profile.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.profilePosts.all }),
      ]);

      const previousTimelineQueries = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.timeline.all,
      });
      const previousProfilePostQueries = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.profilePosts.all,
      });
      const previousProfileQueries = queryClient.getQueriesData<ApiResponse<UserProfile>>({
        queryKey: queryKeys.profile.all,
      });
      const previousPostDetail = queryClient.getQueryData<ApiResponse<Post>>(queryKeys.posts.detail(postId));
      const deletedPost =
        previousPostDetail?.data ??
        findPostInTimelineQueries([...previousTimelineQueries, ...previousProfilePostQueries], postId);

      removePostFromPostQueries(queryClient, postId);

      if (deletedPost) {
        updateProfileStatQueries(queryClient, deletedPost.author.username, "posts", -1);
        updateProfileStatQueries(queryClient, deletedPost.author.username, "likes", -deletedPost.likeCount);
      }

      return { previousPostDetail, previousProfilePostQueries, previousProfileQueries, previousTimelineQueries };
    },
    onError: (_error, _postId, context) => {
      if (context?.previousPostDetail) {
        queryClient.setQueryData(queryKeys.posts.detail(_postId), context.previousPostDetail);
      }
      context?.previousTimelineQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousProfilePostQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousProfileQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (_data, postId) => {
      options?.onSuccess?.(postId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
    },
  });

  return {
    deletePost: mutation.mutate,
    deletingPostId: mutation.variables,
    isDeletingPost: mutation.isPending,
  };
}

function findPostInTimelineQueries(
  queries: Array<[unknown, TimelineInfiniteData | undefined]>,
  postId: Post["id"],
) {
  for (const [, data] of queries) {
    for (const page of data?.pages ?? []) {
      const post = findPostInPayload(page.data, postId);

      if (post) {
        return post;
      }
    }
  }

  return null;
}

function findPostInPayload(payload: unknown, postId: Post["id"]): Post | null {
  if (Array.isArray(payload)) {
    return findPostInItems(payload, postId);
  }

  if (!isRecord(payload)) {
    return null;
  }

  for (const key of POST_COLLECTION_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      const post = findPostInItems(value, postId);

      if (post) {
        return post;
      }
    }
  }

  return null;
}

function findPostInItems(items: unknown[], postId: Post["id"]) {
  for (const item of items) {
    const post = getPostFromCollectionItem(item);

    if (post?.id === postId) {
      return post;
    }
  }

  return null;
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

function isPostLike(value: unknown): value is Post {
  return (
    isRecord(value) &&
    value.id !== undefined &&
    value.id !== null &&
    isRecord(value.author) &&
    typeof value.author.username === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
