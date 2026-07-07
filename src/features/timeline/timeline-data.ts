import type { ApiResponse, PaginatedPosts, Pagination, Post, UserSummary } from "@/lib/types";

const POST_COLLECTION_KEYS = [
  "posts",
  "feed",
  "items",
  "results",
  "data",
  "saved",
  "savedPosts",
  "liked",
  "likedPosts",
  "userPosts",
  "myPosts",
] as const;

export function getTimelinePosts(page: ApiResponse<PaginatedPosts>) {
  return extractPostCandidates(page.data).map(toTimelinePost).filter(isPost);
}

export function getNextTimelinePageParam(lastPage: ApiResponse<PaginatedPosts>) {
  const pagination = extractPagination(lastPage.data);

  if (!pagination) {
    return undefined;
  }

  return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
}

function extractPostCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.map(unwrapPostCandidate);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of POST_COLLECTION_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value.map(unwrapPostCandidate);
    }
  }

  return [];
}

function unwrapPostCandidate(value: unknown) {
  if (!isRecord(value)) {
    return value;
  }

  if (isRecord(value.post)) {
    return value.post;
  }

  if (isRecord(value.savedPost)) {
    return value.savedPost;
  }

  if (isRecord(value.likedPost)) {
    return value.likedPost;
  }

  return value;
}

function extractPagination(payload: unknown): Pagination | null {
  if (!isRecord(payload)) {
    return null;
  }

  const directPagination = toPagination(payload.pagination);

  if (directPagination) {
    return directPagination;
  }

  if (!isRecord(payload.meta)) {
    return null;
  }

  return toPagination(payload.meta.pagination) ?? toPagination(payload.meta);
}

function toPagination(value: unknown): Pagination | null {
  if (!isRecord(value)) {
    return null;
  }

  const page = Number(value.page);
  const limit = Number(value.limit ?? 0);
  const total = Number(value.total ?? 0);
  const totalPages = Number(value.totalPages ?? value.total_pages ?? value.pages);

  if (!Number.isFinite(page) || !Number.isFinite(totalPages)) {
    return null;
  }

  return {
    limit: Number.isFinite(limit) ? limit : 0,
    page,
    total: Number.isFinite(total) ? total : 0,
    totalPages,
  };
}

function toTimelinePost(value: unknown): Post | null {
  if (!isRecord(value) || value.id === undefined || value.id === null || typeof value.imageUrl !== "string") {
    return null;
  }

  return {
    id: Number(value.id),
    imageUrl: value.imageUrl,
    caption: typeof value.caption === "string" ? value.caption : null,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date(0).toISOString(),
    author: toUserSummary(value.author),
    likeCount: toNumber(value.likeCount),
    commentCount: toNumber(value.commentCount),
    likedByMe: Boolean(value.likedByMe),
    savedByMe: value.savedByMe === undefined ? undefined : Boolean(value.savedByMe),
  };
}

function toUserSummary(value: unknown): UserSummary {
  if (isRecord(value) && typeof value.username === "string") {
    return {
      id: toNumber(value.id),
      username: value.username,
      name: typeof value.name === "string" ? value.name : value.username,
      avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : null,
      followsMe: typeof value.followsMe === "boolean" ? value.followsMe : undefined,
      isFollowedByMe: typeof value.isFollowedByMe === "boolean" ? value.isFollowedByMe : undefined,
      isFollowing: typeof value.isFollowing === "boolean" ? value.isFollowing : undefined,
      isMe: typeof value.isMe === "boolean" ? value.isMe : undefined,
    };
  }

  return {
    id: 0,
    username: "unknown",
    name: "Unknown user",
    avatarUrl: null,
  };
}

function toNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isPost(value: Post | null): value is Post {
  return value !== null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
