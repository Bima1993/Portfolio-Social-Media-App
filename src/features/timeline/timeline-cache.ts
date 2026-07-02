import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { ApiResponse, PaginatedPosts, Post } from "@/lib/types";

export type TimelineInfiniteData = InfiniteData<ApiResponse<PaginatedPosts>, number>;

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
    let pageChanged = false;
    const posts = page.data.posts.map((post) => {
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
      data: {
        ...page.data,
        posts,
      },
    };
  });

  return changed ? { ...data, pages } : data;
}

export function updateTimelinePostQueries(
  queryClient: QueryClient,
  postId: Post["id"],
  updatePost: (post: Post) => Post,
) {
  queryClient.setQueriesData<TimelineInfiniteData>({ queryKey: ["timeline"] }, (data) =>
    updatePostInTimelineData(data, postId, updatePost),
  );
}
