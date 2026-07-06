import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedPosts, UserProfile } from "@/lib/types";

export type ProfileStatKey = "posts" | "followers" | "following" | "likes";
export type ProfileStatsFallbacks = Partial<Record<ProfileStatKey, number>>;

const PROFILE_STAT_KEYS: Record<ProfileStatKey, string[]> = {
  followers: ["followers", "follower", "followersCount", "followerCount", "totalFollowers"],
  following: ["following", "followingCount", "totalFollowing"],
  likes: ["likes", "like", "likesCount", "likeCount", "totalLikes"],
  posts: ["posts", "post", "postsCount", "postCount", "totalPosts"],
};

export function getProfileStat(
  profile: UserProfile,
  key: ProfileStatKey,
  fallback?: number,
) {
  const statValue = readProfileStat(profile, key);

  if (fallback !== undefined && Number.isFinite(fallback)) {
    return fallback;
  }

  return statValue ?? 0;
}

export function getProfilePostTotal(data: InfiniteData<ApiResponse<PaginatedPosts>, unknown> | undefined) {
  const firstPageData = data?.pages[0]?.data as unknown;
  const total = readPaginationTotal(firstPageData);

  return total ?? undefined;
}

export function getLoadedPostsLikeTotal(posts: Array<{ likeCount?: number }>) {
  return posts.reduce((total, post) => total + getFiniteNumber(post.likeCount, 0), 0);
}

export function updateProfileStatQueries(
  queryClient: QueryClient,
  username: string | null | undefined,
  key: ProfileStatKey,
  delta: number,
) {
  if (!username || delta === 0) {
    return;
  }

  queryClient.setQueriesData<ApiResponse<UserProfile>>({ queryKey: queryKeys.profile.all }, (current) => {
    if (!current || current.data.username !== username) {
      return current;
    }

    return {
      ...current,
      data: applyProfileStatDelta(current.data, key, delta),
    };
  });
}

export function applyProfileStatDelta(profile: UserProfile, key: ProfileStatKey, delta: number) {
  const currentValue = readProfileStat(profile, key) ?? 0;
  const nextValue = Math.max(0, currentValue + delta);
  const countsKey = key === "posts" ? "posts" : key;

  return {
    ...profile,
    counts: {
      ...profile.counts,
      ...(key === "posts" ? { post: nextValue } : {}),
      [countsKey]: nextValue,
    },
  };
}

function readProfileStat(profile: UserProfile, key: ProfileStatKey) {
  const profileRecord = profile as unknown as Record<string, unknown>;
  const sources = [profileRecord.counts, profileRecord._count, profileRecord.stats, profileRecord];

  for (const source of sources) {
    if (!isRecord(source)) {
      continue;
    }

    for (const candidateKey of PROFILE_STAT_KEYS[key]) {
      const value = toFiniteNumber(source[candidateKey]);

      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function readPaginationTotal(payload: unknown): number | null {
  if (!isRecord(payload)) {
    return null;
  }

  const directTotal = readTotalFromRecord(payload.pagination);

  if (directTotal !== null) {
    return directTotal;
  }

  if (!isRecord(payload.meta)) {
    return null;
  }

  return readTotalFromRecord(payload.meta.pagination) ?? readTotalFromRecord(payload.meta);
}

function readTotalFromRecord(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return toFiniteNumber(value.total ?? value.count ?? value.totalCount);
}

function getFiniteNumber(value: unknown, fallback: number) {
  const numberValue = toFiniteNumber(value);

  return numberValue ?? fallback;
}

function toFiniteNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
