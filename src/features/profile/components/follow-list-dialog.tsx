"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getMyFollowers, getMyFollowing } from "@/features/profile/api";
import { followUser, unfollowUser } from "@/features/social/api";
import { getUserFollowers, getUserFollowing } from "@/features/users/api";
import { getNextUsersPageParam, getUsers } from "@/features/users/users-data";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedUsers, UserProfile, UserSummary } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

type FollowListDialogProps = {
  isOwnProfile: boolean;
  listType: FollowListType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  profile: UserProfile;
};

type FollowListType = "followers" | "following";
type UsersInfiniteData = InfiniteData<ApiResponse<PaginatedUsers>, number>;

const FOLLOW_LIST_PAGE_SIZE = 10;

export function FollowListDialog({
  isOwnProfile,
  listType,
  onOpenChange,
  open,
  profile,
}: FollowListDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user: viewer } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(token);
  const title = listType === "followers" ? "Followers" : "Following";
  const queryKey =
    listType === "followers"
      ? queryKeys.users.followers(profile.username)
      : queryKeys.users.following(profile.username);

  const usersQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => {
      const page = Number(pageParam);

      if (isOwnProfile) {
        return listType === "followers"
          ? getMyFollowers(page, FOLLOW_LIST_PAGE_SIZE)
          : getMyFollowing(page, FOLLOW_LIST_PAGE_SIZE);
      }

      return listType === "followers"
        ? getUserFollowers(profile.username, page, FOLLOW_LIST_PAGE_SIZE)
        : getUserFollowing(profile.username, page, FOLLOW_LIST_PAGE_SIZE);
    },
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: getNextUsersPageParam,
  });

  const followMutation = useMutation({
    mutationFn: ({ nextFollowing, username }: { nextFollowing: boolean; username: string }) =>
      nextFollowing ? followUser(username) : unfollowUser(username),
    onMutate: async ({ nextFollowing, username }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousUsers = queryClient.getQueryData<UsersInfiniteData>(queryKey);
      const previousMeProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(queryKeys.profile.me());

      queryClient.setQueryData<UsersInfiniteData>(queryKey, (current) =>
        updateUserFollowState(current, username, nextFollowing),
      );

      updateProfileFollowingCount(queryClient, viewer, username, nextFollowing, isOwnProfile);

      return { previousMeProfile, previousUsers };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousUsers);
      queryClient.setQueryData(queryKeys.profile.me(), context?.previousMeProfile);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });

  const users = usersQuery.data?.pages.flatMap(getUsers) ?? [];

  function handleFollowClick(targetUser: UserSummary) {
    if (!isAuthenticated) {
      onOpenChange(false);
      router.push("/login");
      return;
    }

    followMutation.mutate({
      nextFollowing: !getIsFollowing(targetUser),
      username: targetUser.username,
    });
  }

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] flex max-h-[min(76vh,560px)] w-[calc(100vw-32px)] max-w-[548px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-secondary p-5 shadow-2xl shadow-black/50 sm:p-6">
          <Dialog.Close className="absolute right-0 -top-12 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary">
            <X className="size-7" />
            <span className="sr-only">Close {title.toLowerCase()} dialog</span>
          </Dialog.Close>

          <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>

          <div className="mt-5 min-h-0 overflow-y-auto pr-1">
            {usersQuery.isPending ? <FollowListSkeleton /> : null}

            {usersQuery.isError ? (
              <div className="rounded-lg border border-border bg-background/50 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {usersQuery.error instanceof Error ? usersQuery.error.message : `Unable to load ${title.toLowerCase()}.`}
                </p>
                <Button className="mt-4 h-10 rounded-full px-5" onClick={() => usersQuery.refetch()} type="button">
                  Retry
                </Button>
              </div>
            ) : null}

            {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
              <p className="rounded-lg border border-border bg-background/50 p-5 text-center text-sm text-muted-foreground">
                No {title.toLowerCase()} yet.
              </p>
            ) : null}

            {users.length > 0 ? (
              <div className="grid gap-5">
                {users.map((user) => {
                  const isCurrentUser = user.isMe || isSameUser(user, viewer);
                  const isFollowing = getIsFollowing(user);
                  const isPendingForUser =
                    followMutation.isPending && followMutation.variables?.username === user.username;

                  return (
                    <div className="flex items-center gap-4" key={user.id}>
                      <Link
                        className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted"
                        href={`/profile/${user.username}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <Image
                          alt={user.name}
                          className="object-cover"
                          fill
                          sizes="48px"
                          src={user.avatarUrl ?? "/globe.svg"}
                        />
                      </Link>

                      <Link
                        className="min-w-0 flex-1"
                        href={`/profile/${user.username}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <span className="block truncate text-base font-bold">{user.name}</span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">{user.username}</span>
                      </Link>

                      {!isCurrentUser ? (
                        <Button
                          className={cn(
                            "h-10 min-w-[112px] rounded-full px-5 text-sm font-bold",
                            isFollowing
                              ? "border-border bg-secondary text-foreground hover:bg-muted"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                          disabled={isPendingForUser}
                          onClick={() => handleFollowClick(user)}
                          type="button"
                          variant={isFollowing ? "outline" : "default"}
                        >
                          {isPendingForUser ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : isFollowing ? (
                            <CheckCircle2 className="size-5" />
                          ) : null}
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {usersQuery.hasNextPage ? (
            <Button
              className="mt-5 h-10 rounded-full"
              disabled={usersQuery.isFetchingNextPage}
              onClick={() => usersQuery.fetchNextPage()}
              type="button"
              variant="outline"
            >
              {usersQuery.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
              {usersQuery.isFetchingNextPage ? "Loading" : "Load More"}
            </Button>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FollowListSkeleton() {
  return (
    <div className="grid gap-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="flex items-center gap-4" key={index}>
          <div className="size-12 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function getIsFollowing(user: UserSummary) {
  return user.isFollowedByMe ?? user.isFollowing ?? false;
}

function updateUserFollowState(
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
