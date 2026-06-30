import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedPosts, PaginatedUsers, UserProfile } from "@/lib/types";

export function searchUsers(query: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>("/api/users/search", {
    query: { q: query, page, limit },
  });
}

export function getUserProfile(username: string) {
  return apiRequest<UserProfile>(`/api/users/${username}`);
}

export function getUserPosts(username: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>(`/api/users/${username}/posts`, {
    query: { page, limit },
  });
}

export function getUserLikes(username: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>(`/api/users/${username}/likes`, {
    query: { page, limit },
  });
}

export function getUserFollowers(username: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>(`/api/users/${username}/followers`, {
    query: { page, limit },
  });
}

export function getUserFollowing(username: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedUsers>(`/api/users/${username}/following`, {
    query: { page, limit },
  });
}
