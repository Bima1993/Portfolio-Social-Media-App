import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedPosts, PaginatedUsers, UserProfile } from "@/lib/types";

export function getMe() {
  return apiRequest<UserProfile>("/api/me");
}

export function updateMe(payload: FormData | Record<string, string | undefined>) {
  return apiRequest<UserProfile>("/api/me", {
    method: "PATCH",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });
}

export function getMyPosts(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>("/api/me/posts", {
    query: { page, limit },
  });
}

export function getMyLikes(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>("/api/me/likes", {
    query: { page, limit },
  });
}

export function getMySaved(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>("/api/me/saved", {
    query: { page, limit },
  });
}

export function getMyFollowers(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>("/api/me/followers", {
    query: { page, limit },
  });
}

export function getMyFollowing(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>("/api/me/following", {
    query: { page, limit },
  });
}
