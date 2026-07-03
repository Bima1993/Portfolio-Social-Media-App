export const DEFAULT_API_BASE_URL = "https://be-social-media-api-production.up.railway.app";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const AUTH_TOKEN_KEY = "sociality.auth.token";

export const POST_SUCCESS_STORAGE_KEY = "sociality.post.success";

export const DEFAULT_PAGE_SIZE = 20;
