"use client";

import type { QueryClient } from "@tanstack/react-query";

import { getMyFollowers, getMyFollowing } from "@/features/profile/api";
import { getUserFollowers, getUserFollowing } from "@/features/users/api";
import { UserListDialog } from "@/features/users/components/user-list-dialog";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, UserProfile } from "@/lib/types";
import { useAppSelector } from "@/store/hooks";

type FollowListDialogProps = {
  isOwnProfile: boolean;
  listType: FollowListType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  profile: UserProfile;
};

type FollowListType = "followers" | "following";
type FollowListContext = {
  previousMeProfile?: ApiResponse<UserProfile>;
};

const FOLLOW_LIST_PAGE_SIZE = 10;

export function FollowListDialog({
  isOwnProfile,
  listType,
  onOpenChange,
  open,
  profile,
}: FollowListDialogProps) {
  const viewer = useAppSelector((state) => state.auth.user);
  const title = listType === "followers" ? "Followers" : "Following";
  const queryKey =
    listType === "followers"
      ? queryKeys.users.followers(profile.username)
      : queryKeys.users.following(profile.username);

  return (
    <UserListDialog<FollowListContext>
      emptyMessage={`No ${title.toLowerCase()} yet.`}
      errorMessage={`Unable to load ${title.toLowerCase()}.`}
      invalidateQueryKeys={[queryKeys.profile.all, queryKeys.users.all]}
      onFollowError={({ context, queryClient }) => {
        queryClient.setQueryData(queryKeys.profile.me(), context?.previousMeProfile);
      }}
      onFollowMutate={({ nextFollowing, queryClient, username }) => {
        const previousMeProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(queryKeys.profile.me());

        updateProfileFollowingCount(queryClient, viewer, username, nextFollowing, isOwnProfile);

        return { previousMeProfile };
      }}
      onOpenChange={onOpenChange}
      open={open}
      queryFn={(page) => {
        if (isOwnProfile) {
          return listType === "followers"
            ? getMyFollowers(page, FOLLOW_LIST_PAGE_SIZE)
            : getMyFollowing(page, FOLLOW_LIST_PAGE_SIZE);
        }

        return listType === "followers"
          ? getUserFollowers(profile.username, page, FOLLOW_LIST_PAGE_SIZE)
          : getUserFollowing(profile.username, page, FOLLOW_LIST_PAGE_SIZE);
      }}
      queryKey={queryKey}
      title={title}
    />
  );
}

function updateProfileFollowingCount(
  queryClient: QueryClient,
  viewer: UserProfile | null | undefined,
  username: string,
  nextFollowing: boolean,
  isOwnProfile: boolean,
) {
  if (!isOwnProfile || !viewer || viewer.username === username) {
    return;
  }

  queryClient.setQueryData<ApiResponse<UserProfile>>(queryKeys.profile.me(), (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      data: {
        ...current.data,
        counts: {
          ...current.data.counts,
          following: Math.max(0, Number(current.data.counts?.following ?? 0) + (nextFollowing ? 1 : -1)),
        },
      },
    };
  });
}
