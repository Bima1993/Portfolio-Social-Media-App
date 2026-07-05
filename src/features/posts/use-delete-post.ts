"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, Post } from "@/lib/types";

import { deletePost as deletePostRequest } from "./api";
import { removePostFromPostQueries, type TimelineInfiniteData } from "../timeline/timeline-cache";

type DeletePostOptions = {
  onSuccess?: (postId: Post["id"]) => void;
};

export function useDeletePost(options?: DeletePostOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (postId: Post["id"]) => deletePostRequest(postId),
    onMutate: async (postId) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.timeline.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.profilePosts.all }),
      ]);

      const previousTimelineQueries = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.timeline.all,
      });
      const previousProfilePostQueries = queryClient.getQueriesData<TimelineInfiniteData>({
        queryKey: queryKeys.profilePosts.all,
      });
      const previousPostDetail = queryClient.getQueryData<ApiResponse<Post>>(queryKeys.posts.detail(postId));

      removePostFromPostQueries(queryClient, postId);

      return { previousPostDetail, previousProfilePostQueries, previousTimelineQueries };
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
