import { apiRequest, setStoredAuthToken } from "@/lib/api";
import type { AuthData, LoginPayload, RegisterPayload } from "@/lib/types";

export async function login(payload: LoginPayload) {
  const response = await apiRequest<AuthData>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.data.token) {
    setStoredAuthToken(response.data.token);
  }

  return response;
}

export async function register(payload: RegisterPayload) {
  const response = await apiRequest<AuthData>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.data.token) {
    setStoredAuthToken(response.data.token);
  }

  return response;
}
