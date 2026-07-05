export const queryKeys = {
  posts: {
    all: ["posts"] as const,
    detail: (postId: number | string) => [...queryKeys.posts.all, "detail", postId] as const,
  },
  postComments: {
    all: ["post-comments"] as const,
    list: (postId: number | string) => [...queryKeys.postComments.all, postId] as const,
  },
  postLikes: {
    all: ["post-likes"] as const,
    list: (postId: number | string) => [...queryKeys.postLikes.all, postId] as const,
  },
  timeline: {
    all: ["timeline"] as const,
    list: (source: TimelineSource) => [...queryKeys.timeline.all, source] as const,
  },
  profile: {
    all: ["profile"] as const,
    me: () => [...queryKeys.profile.all, "me"] as const,
    public: (username: string) => [...queryKeys.profile.all, "public", username] as const,
  },
  profilePosts: {
    all: ["profile-posts"] as const,
    me: (tab: MyProfileTab) => [...queryKeys.profilePosts.all, "me", tab] as const,
    public: (username: string, tab: PublicProfileTab) =>
      [...queryKeys.profilePosts.all, "public", username, tab] as const,
  },
  users: {
    all: ["users"] as const,
    followers: (username: string) => [...queryKeys.users.all, "followers", username] as const,
    following: (username: string) => [...queryKeys.users.all, "following", username] as const,
    search: (query: string) => [...queryKeys.users.all, "search", query] as const,
  },
};

export type TimelineSource = "explore-posts";
export type MyProfileTab = "gallery" | "saved";
export type PublicProfileTab = "gallery" | "liked";
