"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Grid2X2,
  Heart,
  Loader2,
  Send,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getMe, getMyPosts, getMySaved } from "@/features/profile/api";
import { followUser, unfollowUser } from "@/features/social/api";
import { CommentsDialog } from "@/features/timeline/comments-dialog";
import { getNextTimelinePageParam, getTimelinePosts } from "@/features/timeline/timeline-data";
import { getUserLikes, getUserPosts, getUserProfile } from "@/features/users/api";
import { PROFILE_SUCCESS_STORAGE_KEY } from "@/lib/constants";
import { queryKeys, type MyProfileTab, type PublicProfileTab } from "@/lib/query-keys";
import type { ApiResponse, Post, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";

type ProfileViewProps =
  | {
      mode: "me";
      username?: never;
    }
  | {
      mode: "public";
      username: string;
    };

type ProfileTab = MyProfileTab | PublicProfileTab;

type TabItem = {
  icon: LucideIcon;
  label: string;
  value: ProfileTab;
};

const PROFILE_PAGE_SIZE = 12;

export function ProfileView(props: ProfileViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const viewer = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const isAuthenticated = Boolean(token);
  const [activeTab, setActiveTab] = useState<ProfileTab>("gallery");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const profileQueryKey =
    props.mode === "me" ? queryKeys.profile.me() : queryKeys.profile.public(props.username);

  useEffect(() => {
    if (props.mode !== "me" || window.sessionStorage.getItem(PROFILE_SUCCESS_STORAGE_KEY) !== "1") {
      return;
    }

    window.sessionStorage.removeItem(PROFILE_SUCCESS_STORAGE_KEY);
    const showTimeoutId = window.setTimeout(() => setShowSuccessToast(true), 0);
    const hideTimeoutId = window.setTimeout(() => setShowSuccessToast(false), 3500);

    return () => {
      window.clearTimeout(showTimeoutId);
      window.clearTimeout(hideTimeoutId);
    };
  }, [props.mode]);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => (props.mode === "me" ? getMe() : getUserProfile(props.username)),
    initialData:
      props.mode === "me" && viewer
        ? ({
            data: viewer,
            message: "",
            success: true,
          } satisfies ApiResponse<UserProfile>)
        : undefined,
  });

  const profile = profileQuery.data?.data;
  const isOwnProfile = props.mode === "me" || (Boolean(viewer?.username) && viewer?.username === profile?.username);
  const tabs = useMemo<TabItem[]>(
    () =>
      isOwnProfile
        ? [
            { icon: Grid2X2, label: "Gallery", value: "gallery" },
            { icon: Bookmark, label: "Saved", value: "saved" },
          ]
        : [
            { icon: Grid2X2, label: "Gallery", value: "gallery" },
            { icon: Heart, label: "Liked", value: "liked" },
          ],
    [isOwnProfile],
  );

  const currentTab = tabs.some((tab) => tab.value === activeTab) ? activeTab : "gallery";

  const postsQuery = useInfiniteQuery({
    queryKey: getProfilePostsQueryKey(props, isOwnProfile, currentTab),
    queryFn: ({ pageParam }) => {
      const page = Number(pageParam);

      if (isOwnProfile) {
        return currentTab === "saved" ? getMySaved(page, PROFILE_PAGE_SIZE) : getMyPosts(page, PROFILE_PAGE_SIZE);
      }

      if (props.mode === "public") {
        return currentTab === "liked"
          ? getUserLikes(props.username, page, PROFILE_PAGE_SIZE)
          : getUserPosts(props.username, page, PROFILE_PAGE_SIZE);
      }

      return getMyPosts(page, PROFILE_PAGE_SIZE);
    },
    enabled: Boolean(profile),
    initialPageParam: 1,
    getNextPageParam: getNextTimelinePageParam,
  });

  const followMutation = useMutation({
    mutationFn: ({ nextFollowing, username }: { nextFollowing: boolean; username: string }) =>
      nextFollowing ? followUser(username) : unfollowUser(username),
    onMutate: async ({ nextFollowing }) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previousProfile = queryClient.getQueryData<ApiResponse<UserProfile>>(profileQueryKey);

      queryClient.setQueryData<ApiResponse<UserProfile>>(profileQueryKey, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          data: {
            ...current.data,
            counts: {
              ...current.data.counts,
              followers: Math.max(0, getProfileStat(current.data, "followers") + (nextFollowing ? 1 : -1)),
            },
            isFollowedByMe: nextFollowing,
            isFollowing: nextFollowing,
          },
        };
      });

      return { previousProfile };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(profileQueryKey, context?.previousProfile);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  const posts = postsQuery.data?.pages.flatMap(getTimelinePosts) ?? [];

  function handleFollowToggle() {
    if (!profile) {
      return;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    followMutation.mutate({
      nextFollowing: !getIsFollowing(profile),
      username: profile.username,
    });
  }

  return (
    <>
      <ProfileMobileHeader title={profile?.name ?? (props.mode === "me" ? "Profile" : props.username)} />
      <section className="mx-auto w-full max-w-[812px] px-4 pb-28 pt-6 lg:pb-24 lg:pt-10">
        {showSuccessToast ? <ProfileSuccessToast onClose={() => setShowSuccessToast(false)} /> : null}

        {profileQuery.isPending ? <ProfileSkeleton /> : null}

        {profileQuery.isError ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <h1 className="text-lg font-bold">Unable to load profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profileQuery.error instanceof Error ? profileQuery.error.message : "Please try again in a moment."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => profileQuery.refetch()} type="button">
              Retry
            </Button>
          </div>
        ) : null}

        {profile ? (
          <>
            <ProfileHeader
              followPending={followMutation.isPending}
              isOwnProfile={Boolean(isOwnProfile)}
              onFollowToggle={handleFollowToggle}
              profile={profile}
            />

            <ProfileStats profile={profile} />

            <div className="mt-7 border-b border-border">
              <div className="grid grid-cols-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const selected = currentTab === tab.value;

                  return (
                    <button
                      className={cn(
                        "flex h-12 items-center justify-center gap-3 border-b-2 text-base font-bold transition-colors",
                        selected
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      type="button"
                    >
                      <Icon className={cn("size-5", selected && tab.value !== "gallery" && "fill-foreground")} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <ProfilePostsContent
              activeTab={currentTab}
              error={postsQuery.error}
              fetchNextPage={postsQuery.fetchNextPage}
              hasNextPage={Boolean(postsQuery.hasNextPage)}
              isError={postsQuery.isError}
              isFetchingNextPage={postsQuery.isFetchingNextPage}
              isOwnProfile={Boolean(isOwnProfile)}
              isPending={postsQuery.isPending}
              onPostClick={setSelectedPost}
              posts={posts}
              refetch={() => postsQuery.refetch()}
            />
          </>
        ) : null}
      </section>

      {selectedPost ? (
        <CommentsDialog
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPost(null);
            }
          }}
          open={Boolean(selectedPost)}
          post={selectedPost}
        />
      ) : null}
    </>
  );
}

function ProfileHeader({
  followPending,
  isOwnProfile,
  onFollowToggle,
  profile,
}: {
  followPending: boolean;
  isOwnProfile: boolean;
  onFollowToggle: () => void;
  profile: UserProfile;
}) {
  const isFollowing = getIsFollowing(profile);

  return (
    <header>
      <div className="flex items-start gap-4 lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ProfileAvatar className="size-16" profile={profile} />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold lg:text-xl">{profile.name}</h1>
            <p className="mt-1 truncate text-base text-muted-foreground">{profile.username}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {isOwnProfile ? (
            <Button asChild className="h-12 rounded-full border-border px-8 text-base font-bold" variant="outline">
              <Link href="/me/edit">Edit Profile</Link>
            </Button>
          ) : (
            <FollowButton isFollowing={isFollowing} isPending={followPending} onClick={onFollowToggle} />
          )}
          <button
            aria-label="Share profile"
            className="flex size-12 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
            type="button"
          >
            <Send className="size-6" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 lg:hidden">
        {isOwnProfile ? (
          <Button asChild className="h-10 flex-1 rounded-full border-border text-sm font-bold" variant="outline">
            <Link href="/me/edit">Edit Profile</Link>
          </Button>
        ) : (
          <FollowButton
            className="h-10 flex-1 text-sm"
            isFollowing={isFollowing}
            isPending={followPending}
            onClick={onFollowToggle}
          />
        )}
        <button
          aria-label="Share profile"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
          type="button"
        >
          <Send className="size-5" />
        </button>
      </div>

      {profile.bio ? <p className="mt-5 text-base leading-7 text-foreground">{profile.bio}</p> : null}
    </header>
  );
}

function FollowButton({
  className,
  isFollowing,
  isPending,
  onClick,
}: {
  className?: string;
  isFollowing: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(
        "h-12 min-w-32 rounded-full px-8 text-base font-bold",
        isFollowing
          ? "border-border bg-background text-foreground hover:bg-secondary"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
      disabled={isPending}
      onClick={onClick}
      type="button"
      variant={isFollowing ? "outline" : "default"}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      {!isPending && isFollowing ? <CheckCircle2 className="size-5" /> : null}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}

function ProfileStats({ profile }: { profile: UserProfile }) {
  const stats = [
    { label: "Post", value: getProfileStat(profile, "posts") },
    { label: "Followers", value: getProfileStat(profile, "followers") },
    { label: "Following", value: getProfileStat(profile, "following") },
    { label: "Likes", value: getProfileStat(profile, "likes") },
  ];

  return (
    <div className="mt-5 grid grid-cols-4">
      {stats.map((stat, index) => (
        <div className={cn("text-center", index > 0 && "border-l border-border")} key={stat.label}>
          <p className="text-xl font-bold lg:text-2xl">{stat.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function ProfilePostsContent({
  activeTab,
  error,
  fetchNextPage,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isOwnProfile,
  isPending,
  onPostClick,
  posts,
  refetch,
}: {
  activeTab: ProfileTab;
  error: unknown;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isOwnProfile: boolean;
  isPending: boolean;
  onPostClick: (post: Post) => void;
  posts: Post[];
  refetch: () => void;
}) {
  if (isPending) {
    return <ProfileGridSkeleton />;
  }

  if (isError) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-secondary/40 p-8 text-center">
        <h2 className="text-lg font-bold">Unable to load posts</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Please try again in a moment."}
        </p>
        <Button className="mt-4 rounded-full" onClick={refetch} type="button">
          Retry
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return <ProfileEmptyState activeTab={activeTab} isOwnProfile={isOwnProfile} />;
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <button
            aria-label="Open post"
            className="relative aspect-square overflow-hidden rounded-sm bg-secondary"
            key={post.id}
            onClick={() => onPostClick(post)}
            type="button"
          >
            <Image
              alt={post.caption ?? "Sociality post image"}
              className="object-cover transition-transform duration-300 hover:scale-105"
              fill
              sizes="(max-width: 640px) 33vw, 270px"
              src={post.imageUrl}
            />
          </button>
        ))}
      </div>

      {hasNextPage ? (
        <div className="mt-8 flex justify-center">
          <Button
            className="h-11 rounded-full px-6"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            type="button"
            variant="outline"
          >
            {isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
            {isFetchingNextPage ? "Loading" : "Load More"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function ProfileEmptyState({ activeTab, isOwnProfile }: { activeTab: ProfileTab; isOwnProfile: boolean }) {
  const isGallery = activeTab === "gallery";
  const title = isGallery ? "Your story starts here" : activeTab === "saved" ? "No saved posts yet" : "No liked posts yet";
  const description = isGallery
    ? "Share your first post and let the world see your moments, passions, and memories. Make this space truly yours."
    : "Posts will appear here when they are available.";

  return (
    <div className="mx-auto mt-28 max-w-[430px] text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      {isOwnProfile && isGallery ? (
        <Button asChild className="mt-5 h-12 rounded-full px-12 text-base font-bold">
          <Link href="/posts/new">Upload My First Post</Link>
        </Button>
      ) : null}
    </div>
  );
}

function ProfileGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-3 gap-1">
      {Array.from({ length: 9 }).map((_, index) => (
        <div className="aspect-square animate-pulse rounded-sm bg-secondary" key={index} />
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-secondary" />
        <div className="space-y-3">
          <div className="h-5 w-40 rounded-full bg-secondary" />
          <div className="h-4 w-24 rounded-full bg-secondary" />
        </div>
      </div>
      <div className="mt-6 h-4 w-full rounded-full bg-secondary" />
      <div className="mt-7 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-14 rounded-lg bg-secondary" key={index} />
        ))}
      </div>
      <ProfileGridSkeleton />
    </div>
  );
}

function ProfileSuccessToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed left-4 right-4 top-20 z-[70] flex h-12 items-center justify-between rounded-lg bg-[#109d58] px-4 text-sm font-bold text-white shadow-lg shadow-black/30 sm:left-auto sm:right-8 sm:w-[292px] lg:top-28">
      Profile Success Update
      <button aria-label="Close profile success message" onClick={onClose} type="button">
        <X className="size-5" />
      </button>
    </div>
  );
}

function ProfileMobileHeader({ title }: { title: string }) {
  const router = useRouter();
  const viewer = useAppSelector((state) => state.auth.user);
  const viewerName = viewer?.name ?? viewer?.username ?? "Profile";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Go back"
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h1 className="truncate text-lg font-bold">{title}</h1>
      </div>
      <Link
        aria-label="Open my profile"
        className="relative size-10 shrink-0 overflow-hidden rounded-full bg-secondary"
        href="/me"
      >
        {viewer?.avatarUrl ? (
          <Image alt={viewerName} className="object-cover" fill sizes="40px" src={viewer.avatarUrl} />
        ) : (
          <span className="flex size-full items-center justify-center">
            <UserRound className="size-5" />
          </span>
        )}
      </Link>
    </header>
  );
}

function ProfileAvatar({ className, profile }: { className?: string; profile: UserProfile }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full bg-secondary", className)}>
      {profile.avatarUrl ? (
        <Image alt={profile.name} className="object-cover" fill sizes="80px" src={profile.avatarUrl} />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <UserRound className="size-8" />
        </span>
      )}
    </div>
  );
}

function getProfilePostsQueryKey(props: ProfileViewProps, isOwnProfile: boolean, activeTab: ProfileTab) {
  if (isOwnProfile) {
    return queryKeys.profilePosts.me(activeTab === "saved" ? "saved" : "gallery");
  }

  if (props.mode === "public") {
    return queryKeys.profilePosts.public(props.username, activeTab === "liked" ? "liked" : "gallery");
  }

  return queryKeys.profilePosts.me("gallery");
}

function getProfileStat(profile: UserProfile, key: "posts" | "followers" | "following" | "likes") {
  const counts = profile.counts as Record<string, unknown> | undefined;
  const value = key === "posts" ? counts?.posts ?? counts?.post : counts?.[key];
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getIsFollowing(profile: UserProfile) {
  return profile.isFollowedByMe ?? profile.isFollowing ?? false;
}
