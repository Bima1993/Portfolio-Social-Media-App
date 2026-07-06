"use client";

import { getMyFollowers, getMyFollowing } from "@/features/profile/api";
import { getUserFollowers, getUserFollowing } from "@/features/users/api";
import { UserListDialog } from "@/features/users/components/user-list-dialog";
import { queryKeys } from "@/lib/query-keys";
import type { UserProfile } from "@/lib/types";

type FollowListDialogProps = {
  isOwnProfile: boolean;
  listType: FollowListType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  profile: UserProfile;
};

type FollowListType = "followers" | "following";

const FOLLOW_LIST_PAGE_SIZE = 10;

export function FollowListDialog({
  isOwnProfile,
  listType,
  onOpenChange,
  open,
  profile,
}: FollowListDialogProps) {
  const title = listType === "followers" ? "Followers" : "Following";
  const queryKey =
    listType === "followers"
      ? queryKeys.users.followers(profile.username)
      : queryKeys.users.following(profile.username);

  return (
    <UserListDialog
      emptyMessage={`No ${title.toLowerCase()} yet.`}
      errorMessage={`Unable to load ${title.toLowerCase()}.`}
      invalidateQueryKeys={[queryKeys.users.all]}
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
