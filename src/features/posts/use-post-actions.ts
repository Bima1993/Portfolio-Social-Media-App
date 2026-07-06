"use client";

import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { updateProfileStatQueries } from "@/features/profile/profile-stats";
import { likePost, savePost, unlikePost, unsavePost } from "@/features/social/api";
import { updateTimelinePostQueries, type TimelineInfiniteData } from "@/features/timeline/timeline-cache";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Post, UserProfile } from "@/lib/types";
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
