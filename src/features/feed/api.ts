import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { PaginatedPosts } from "@/lib/types";

export function getFeed(page = 1, limit = DEFAULT_PAGE_SIZE) {
  return apiRequest<PaginatedPosts>("/api/feed", {
    query: { page, limit },
  });
}
