"use client";

import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { updateProfileStatQueries } from "@/features/profile/profile-stats";
import { likePost, savePost, unlikePost, unsavePost } from "@/features/social/api";
import { updateTimelinePostQueries, type TimelineInfiniteData } from "@/features/timeline/timeline-cache";
import { getTimelinePosts } from "@/features/timeline/timeline-data";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Pagination, Post, UserProfile } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";

type CacheSnapshot = Array<[QueryKey, unknown]>;

export function usePostActions(post: Post) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = Boolean(token);
  const savedByMe = Boolean(post.savedByMe);

  const likeMutation = useMutation({
    mutationFn: ({ nextLiked }: { nextLiked: boolean }) =>
      nextLiked ? likePost(post.id) : unlikePost(post.id),
    onMutate: async ({ nextLiked }) => {
      await cancelPostCacheQueries(queryClient, post.id);
      const previousPostCaches = takePostCacheSnapshot(queryClient, post.id);

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        likeCount: Math.max(0, currentPost.likeCount + (nextLiked ? 1 : -1)),
        likedByMe: nextLiked,
      }));
      updateProfileStatQueries(queryClient, post.author.username, "likes", nextLiked ? 1 : -1);

      return { previousPostCaches };
    },
    onError: (_error, _variables, context) => {
      restoreCacheSnapshot(queryClient, context?.previousPostCaches);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(post.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ nextSaved }: { nextSaved: boolean }) =>
      nextSaved ? savePost(post.id) : unsavePost(post.id),
    onMutate: async ({ nextSaved }) => {
      await cancelPostCacheQueries(queryClient, post.id);
      const previousPostCaches = takePostCacheSnapshot(queryClient, post.id);

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        savedByMe: nextSaved,
      }));
      updateSavedPostsQuery(queryClient, post, nextSaved);

      return { previousPostCaches };
    },
    onError: (_error, _variables, context) => {
      restoreCacheSnapshot(queryClient, context?.previousPostCaches);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(post.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
    },
  });

  function requireAuthentication() {
    if (isAuthenticated) {
      return true;
    }

    router.push("/login");
    return false;
  }

  function toggleLike() {
    if (!requireAuthentication() || likeMutation.isPending) {
      return;
    }

    likeMutation.mutate({ nextLiked: !post.likedByMe });
  }

  function toggleSave() {
    if (!requireAuthentication() || saveMutation.isPending) {
      return;
    }

    saveMutation.mutate({ nextSaved: !savedByMe });
  }

  return {
    isLikePending: likeMutation.isPending,
    isSavePending: saveMutation.isPending,
    savedByMe,
    toggleLike,
    toggleSave,
  };
}

function cancelPostCacheQueries(queryClient: QueryClient, postId: Post["id"]) {
  return Promise.all([
    queryClient.cancelQueries({ queryKey: queryKeys.timeline.all }),
    queryClient.cancelQueries({ queryKey: queryKeys.profilePosts.all }),
    queryClient.cancelQueries({ queryKey: queryKeys.profile.all }),
    queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) }),
  ]);
}

function takePostCacheSnapshot(queryClient: QueryClient, postId: Post["id"]): CacheSnapshot {
  return [
    ...queryClient.getQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.timeline.all }),
    ...queryClient.getQueriesData<TimelineInfiniteData>({ queryKey: queryKeys.profilePosts.all }),
    ...queryClient.getQueriesData<ApiResponse<UserProfile>>({ queryKey: queryKeys.profile.all }),
    [queryKeys.posts.detail(postId), queryClient.getQueryData<ApiResponse<Post>>(queryKeys.posts.detail(postId))],
  ];
}

function restoreCacheSnapshot(queryClient: QueryClient, snapshot: CacheSnapshot | undefined) {
  snapshot?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

function updateSavedPostsQuery(queryClient: QueryClient, post: Post, nextSaved: boolean) {
  queryClient.setQueryData<TimelineInfiniteData>(queryKeys.profilePosts.me("saved"), (data) => {
    if (!data && !nextSaved) {
      return data;
    }

    const currentPosts = data?.pages.flatMap(getTimelinePosts) ?? [];
    const alreadySaved = currentPosts.some((currentPost) => currentPost.id === post.id);
    const nextPosts = nextSaved
      ? [{ ...post, savedByMe: true }, ...currentPosts.filter((currentPost) => currentPost.id !== post.id)]
      : currentPosts.filter((currentPost) => currentPost.id !== post.id);
    const currentPagination = getFirstPagination(data);
    const totalDelta = nextSaved && !alreadySaved ? 1 : !nextSaved && alreadySaved ? -1 : 0;
    const total =
      currentPagination?.total !== undefined
        ? Math.max(0, currentPagination.total + totalDelta)
        : nextPosts.length;
    const limit = currentPagination?.limit && currentPagination.limit > 0
      ? currentPagination.limit
      : Math.max(nextPosts.length, 1);

    return {
      pageParams: [data?.pageParams[0] ?? 1],
      pages: [
        {
          data: {
            posts: nextPosts,
            pagination: {
              limit,
              page: currentPagination?.page ?? 1,
              total,
              totalPages: Math.max(1, Math.ceil(total / limit)),
            },
          },
          message: data?.pages[0]?.message ?? "OK",
          success: data?.pages[0]?.success ?? true,
        },
      ],
    };
  });
}

function getFirstPagination(data: TimelineInfiniteData | undefined): Pagination | null {
  const pagination = data?.pages[0]?.data.pagination;

  if (!pagination) {
    return null;
  }

  return pagination;
}
