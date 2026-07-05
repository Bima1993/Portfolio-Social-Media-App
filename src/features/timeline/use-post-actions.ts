"use client";

import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { likePost, savePost, unlikePost, unsavePost } from "@/features/social/api";
import { queryKeys } from "@/lib/query-keys";
import type { Post } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";

import { updateTimelinePostQueries, type TimelineInfiniteData } from "./timeline-cache";

type TimelineSnapshot = Array<[QueryKey, TimelineInfiniteData | undefined]>;

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
      await queryClient.cancelQueries({ queryKey: queryKeys.timeline.all });

      const previousTimeline = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.timeline.all,
      });

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        likeCount: Math.max(0, currentPost.likeCount + (nextLiked ? 1 : -1)),
        likedByMe: nextLiked,
      }));

      return { previousTimeline };
    },
    onError: (_error, _variables, context) => {
      restoreTimelineSnapshot(queryClient, context?.previousTimeline);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(post.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profilePosts.all });
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ nextSaved }: { nextSaved: boolean }) =>
      nextSaved ? savePost(post.id) : unsavePost(post.id),
    onMutate: async ({ nextSaved }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.timeline.all });

      const previousTimeline = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.timeline.all,
      });

      updateTimelinePostQueries(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        savedByMe: nextSaved,
      }));

      return { previousTimeline };
    },
    onError: (_error, _variables, context) => {
      restoreTimelineSnapshot(queryClient, context?.previousTimeline);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeline.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(post.id) });
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

function restoreTimelineSnapshot(queryClient: QueryClient, snapshot: TimelineSnapshot | undefined) {
  snapshot?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}
