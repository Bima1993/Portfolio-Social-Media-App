import type { Post } from "@/lib/types";

const author = {
  id: 1,
  username: "johndoe",
  name: "Johndoe",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
};

export const timelinePosts: Post[] = [
  {
    id: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=90",
    caption:
      "Creating unforgettable moments with my favorite person! 📸✨ Let's cherish every second together! ...",
    createdAt: "1 Minutes Ago",
    author,
    likeCount: 20,
    commentCount: 20,
    likedByMe: true,
    savedByMe: false,
  },
  {
    id: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=90",
    caption:
      "Creating unforgettable moments with my favorite person! 📸✨ Let's cherish every second together! ...",
    createdAt: "1 Minutes Ago",
    author,
    likeCount: 20,
    commentCount: 20,
    likedByMe: false,
    savedByMe: false,
  },
  {
    id: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=90",
    caption:
      "Creating unforgettable moments with my favorite person! 📸✨ Let's cherish every second together! ...",
    createdAt: "1 Minutes Ago",
    author,
    likeCount: 20,
    commentCount: 20,
    likedByMe: false,
    savedByMe: false,
  },
  {
    id: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=90",
    caption:
      "Creating unforgettable moments with my favorite person! 📸✨ Let's cherish every second together! ...",
    createdAt: "1 Minutes Ago",
    author,
    likeCount: 20,
    commentCount: 20,
    likedByMe: false,
    savedByMe: false,
  },
];
