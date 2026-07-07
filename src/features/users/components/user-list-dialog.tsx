"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useInfiniteQuery, useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { updateProfileStatQueries } from "@/features/profile/profile-stats";
import { followUser, unfollowUser } from "@/features/social/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedUsers, UserProfile, UserSummary } from "@/lib/types";
import { isSameUser } from "@/lib/user";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

import { getNextUsersPageParam, getUsers } from "../users-data";
import { getIsFollowing, updateUserFollowState, type UsersInfiniteData } from "../users-cache";

type UserListDialogProps<TExtraContext = unknown> = {
  emptyMessage: string;
  errorMessage: string;
  invalidateQueryKeys?: QueryKey[];
  onFollowError?: (args: {
    context: TExtraContext | undefined;
    queryClient: QueryClient;
  }) => void;
  onFollowMutate?: (args: {
    nextFollowing: boolean;
    queryClient: QueryClient;
    username: string;
  }) => TExtraContext | Promise<TExtraContext>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  queryFn: (page: number) => Promise<ApiResponse<PaginatedUsers>>;
  queryKey: QueryKey;
  title: string;
};

export function UserListDialog<TExtraContext = unknown>({
  emptyMessage,
  errorMessage,
  invalidateQueryKeys = [],
  onFollowError,
  onFollowMutate,
  onOpenChange,
  open,
  queryFn,
  queryKey,
  title,
}: UserListDialogProps<TExtraContext>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user: viewer } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(token);

  const usersQuery = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(Number(pageParam)),
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
      const previousProfiles = queryClient.getQueriesData<ApiResponse<UserProfile>>({
        queryKey: queryKeys.profile.all,
      });
      const extraContext = await onFollowMutate?.({ nextFollowing, queryClient, username });
      const delta = nextFollowing ? 1 : -1;

      queryClient.setQueryData<UsersInfiniteData>(queryKey, (current) =>
        updateUserFollowState(current, username, nextFollowing),
      );

      if (viewer?.username && viewer.username !== username) {
        updateProfileStatQueries(queryClient, viewer.username, "following", delta);
        updateProfileStatQueries(queryClient, username, "followers", delta);
      }

      return { extraContext, previousProfiles, previousUsers };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(queryKey, context?.previousUsers);
      context?.previousProfiles.forEach(([profileQueryKey, profileData]) => {
        queryClient.setQueryData(profileQueryKey, profileData);
      });
      onFollowError?.({ context: context?.extraContext, queryClient });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      invalidateQueryKeys.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: key });
      });
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
          <Dialog.Description className="sr-only">{emptyMessage}</Dialog.Description>

          <div className="mt-5 min-h-0 overflow-y-auto pr-1">
            {usersQuery.isPending ? <UserListSkeleton /> : null}

            {usersQuery.isError ? (
              <div className="rounded-lg border border-border bg-background/50 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {usersQuery.error instanceof Error ? usersQuery.error.message : errorMessage}
                </p>
                <Button className="mt-4 h-10 rounded-full px-5" onClick={() => usersQuery.refetch()} type="button">
                  Retry
                </Button>
              </div>
            ) : null}

            {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
              <p className="rounded-lg border border-border bg-background/50 p-5 text-center text-sm text-muted-foreground">
                {emptyMessage}
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

function UserListSkeleton() {
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
