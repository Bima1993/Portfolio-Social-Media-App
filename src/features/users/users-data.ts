import type { ApiResponse, PaginatedUsers, Pagination, UserSummary } from "@/lib/types";

const USER_COLLECTION_KEYS = ["users", "items", "results", "data"] as const;

export function getUsers(page: ApiResponse<PaginatedUsers>) {
  return extractUserCandidates(page.data).filter(isUserSummary);
}

export function getNextUsersPageParam(lastPage: ApiResponse<PaginatedUsers>) {
  const pagination = extractPagination(lastPage.data);

  if (!pagination) {
    return undefined;
  }

  return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
}

function extractUserCandidates(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of USER_COLLECTION_KEYS) {
    const value = payload[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
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

function isUserSummary(value: unknown): value is UserSummary {
  return (
    isRecord(value) &&
    value.id !== undefined &&
    value.id !== null &&
    typeof value.username === "string" &&
    typeof value.name === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
