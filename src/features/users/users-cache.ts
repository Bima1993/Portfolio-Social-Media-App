import type { InfiniteData } from "@tanstack/react-query";

import type { ApiResponse, PaginatedUsers, UserSummary } from "@/lib/types";

export type UsersInfiniteData = InfiniteData<ApiResponse<PaginatedUsers>, number>;

export function getIsFollowing(user: UserSummary) {
  return user.isFollowedByMe ?? user.isFollowing ?? false;
}

export function updateUserFollowState(
  data: UsersInfiniteData | undefined,
  username: string,
  nextFollowing: boolean,
) {
  if (!data) {
    return data;
  }

  let changed = false;
  const pages = data.pages.map((page) => {
    let pageChanged = false;
    const users = page.data.users.map((user) => {
      if (user.username !== username) {
        return user;
      }

      changed = true;
      pageChanged = true;
      return {
        ...user,
        isFollowedByMe: nextFollowing,
        isFollowing: nextFollowing,
      };
    });

    if (!pageChanged) {
      return page;
    }

    return {
      ...page,
      data: {
        ...page.data,
        users,
      },
    };
  });

  return changed ? { ...data, pages } : data;
}
