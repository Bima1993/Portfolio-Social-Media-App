export type QueryValue = string | number | boolean | null | undefined;

export type ApiResponse<TData> = {
  success: boolean;
  message: string;
  data: TData;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedPosts = {
  posts: Post[];
  pagination: Pagination;
};

export type PaginatedUsers = {
  users: UserSummary[];
  pagination: Pagination;
};

export type PaginatedComments = {
  comments: Comment[];
  pagination: Pagination;
};

export type UserSummary = {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  isFollowedByMe?: boolean;
  isFollowing?: boolean;
  isMe?: boolean;
  followsMe?: boolean;
};

export type UserProfile = UserSummary & {
  email?: string;
  phone?: string | null;
  bio?: string | null;
  counts?: {
    post?: number;
    posts?: number;
    followers?: number;
    following?: number;
    likes?: number;
    saved?: number;
  };
};

export type Post = {
  id: number;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  author: UserSummary;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe?: boolean;
};

export type Comment = {
  id: number;
  text: string;
  createdAt: string;
  author: UserSummary;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
};

export type AuthData = {
  token: string;
  user?: UserProfile;
};
