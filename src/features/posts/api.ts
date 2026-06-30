import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedPosts, Post } from "@/lib/types";

export function getExplorePosts(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>("/api/posts", {
    query: { page, limit },
  });
}

export function getPost(postId: number | string) {
  return apiRequest<Post>(`/api/posts/${postId}`);
}

export function createPost(payload: { image: File; caption?: string }) {
  const formData = new FormData();
  formData.append("image", payload.image);

  if (payload.caption) {
    formData.append("caption", payload.caption);
  }

  return apiRequest<Post>("/api/posts", {
    method: "POST",
    body: formData,
  });
}

export function deletePost(postId: number | string) {
  return apiRequest<unknown>(`/api/posts/${postId}`, {
    method: "DELETE",
  });
}
