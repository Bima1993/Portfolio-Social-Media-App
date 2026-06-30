import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { Comment, PaginatedComments, PaginatedUsers } from "@/lib/types";

export function likePost(postId: number | string) {
  return apiRequest<unknown>(`/api/posts/${postId}/like`, {
    method: "POST",
  });
}

export function unlikePost(postId: number | string) {
  return apiRequest<unknown>(`/api/posts/${postId}/like`, {
    method: "DELETE",
  });
}

export function getPostLikes(postId: number | string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>(`/api/posts/${postId}/likes`, {
    query: { page, limit },
  });
}

export function savePost(postId: number | string) {
  return apiRequest<unknown>(`/api/posts/${postId}/save`, {
    method: "POST",
  });
}

export function unsavePost(postId: number | string) {
  return apiRequest<unknown>(`/api/posts/${postId}/save`, {
    method: "DELETE",
  });
}

export function followUser(username: string) {
  return apiRequest<unknown>(`/api/follow/${username}`, {
    method: "POST",
  });
}

export function unfollowUser(username: string) {
  return apiRequest<unknown>(`/api/follow/${username}`, {
    method: "DELETE",
  });
}

export function getComments(postId: number | string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedComments>(`/api/posts/${postId}/comments`, {
    query: { page, limit },
  });
}

export function createComment(postId: number | string, text: string) {
  return apiRequest<Comment>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function deleteComment(commentId: number | string) {
  return apiRequest<unknown>(`/api/comments/${commentId}`, {
    method: "DELETE",
  });
}
