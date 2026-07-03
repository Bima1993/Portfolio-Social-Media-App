"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { CheckCircle2, Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { followUser, getPostLikes, unfollowUser } from "@/features/social/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, PaginatedUsers, UserSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

type LikesDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  postId: number;
};

type LikesInfiniteData = InfiniteData<ApiResponse<PaginatedUsers>, number>;

const LIKES_PAGE_SIZE = 10;

export function LikesDialog({ onOpenChange, open, postId }: LikesDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user: viewer } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(token);
  const likesQueryKey = queryKeys.postLikes.list(postId);
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery({
    queryKey: likesQueryKey,
    queryFn: ({ pageParam }) => getPostLikes(postId, Number(pageParam), LIKES_PAGE_SIZE),
    enabled: open,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data.pagination;

      return page < totalPages ? page + 1 : undefined;
    },
  });

  const followMutation = useMutation({
    mutationFn: ({ nextFollowing, username }: { nextFollowing: boolean; username: string }) =>
      nextFollowing ? followUser(username) : unfollowUser(username),
    onMutate: async ({ nextFollowing, username }) => {
      await queryClient.cancelQueries({ queryKey: likesQueryKey });

      const previousLikes = queryClient.getQueryData<LikesInfiniteData>(likesQueryKey);

      queryClient.setQueryData<LikesInfiniteData>(likesQueryKey, (current) =>
        updateUserFollowState(current, username, nextFollowing),
      );

      return { previousLikes };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(likesQueryKey, context?.previousLikes);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: likesQueryKey });
    },
  });

  const users = data?.pages.flatMap((page) => page.data.users) ?? [];

  function handleFollowClick(targetUser: UserSummary) {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const isFollowing = getIsFollowing(targetUser);

    followMutation.mutate({
      nextFollowing: !isFollowing,
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
            <span className="sr-only">Close likes dialog</span>
          </Dialog.Close>

          <Dialog.Title className="text-xl font-bold">Likes</Dialog.Title>

          <div className="mt-5 min-h-0 overflow-y-auto pr-1">
            {isPending ? <LikesSkeleton /> : null}

            {isError ? (
              <div className="rounded-lg border border-border bg-background/50 p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Unable to load likes."}
                </p>
                <Button className="mt-4 h-10 rounded-full px-5" onClick={() => refetch()} type="button">
                  Retry
                </Button>
              </div>
            ) : null}

            {!isPending && !isError && users.length === 0 ? (
              <p className="rounded-lg border border-border bg-background/50 p-5 text-center text-sm text-muted-foreground">
                No likes yet.
              </p>
            ) : null}

            {users.length > 0 ? (
              <div className="grid gap-5">
                {users.map((likedUser) => {
                  const isCurrentUser = likedUser.isMe || likedUser.username === viewer?.username;
                  const isFollowing = getIsFollowing(likedUser);
                  const isPendingForUser =
                    followMutation.isPending && followMutation.variables?.username === likedUser.username;

                  return (
                    <div className="flex items-center gap-4" key={likedUser.id}>
                      <Link
                        className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted"
                        href={`/profile/${likedUser.username}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <Image
                          alt={likedUser.name}
                          className="object-cover"
                          fill
                          sizes="48px"
                          src={likedUser.avatarUrl ?? "/globe.svg"}
                        />
                      </Link>

                      <Link
                        className="min-w-0 flex-1"
                        href={`/profile/${likedUser.username}`}
                        onClick={() => onOpenChange(false)}
                      >
                        <span className="block truncate text-base font-bold">{likedUser.name}</span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                          {likedUser.username}
                        </span>
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
                          onClick={() => handleFollowClick(likedUser)}
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

          {hasNextPage ? (
            <Button
              className="mt-5 h-10 rounded-full"
              disabled={isFetchingNextPage}
              onClick={() => fetchNextPage()}
              type="button"
              variant="outline"
            >
              {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
              {isFetchingNextPage ? "Loading" : "Load More"}
            </Button>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function LikesSkeleton() {
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
  data: LikesInfiniteData | undefined,
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
