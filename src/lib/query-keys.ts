export const queryKeys = {
  postLikes: {
    all: ["post-likes"] as const,
    list: (postId: number | string) => [...queryKeys.postLikes.all, postId] as const,
  },
  timeline: {
    all: ["timeline"] as const,
    list: (source: TimelineSource) => [...queryKeys.timeline.all, source] as const,
  },
};

export type TimelineSource = "explore-posts";
