import type { UserSummary } from "./types";

type ComparableUser = Pick<UserSummary, "id" | "username"> | null | undefined;

export function isSameUser(firstUser: ComparableUser, secondUser: ComparableUser) {
  if (!firstUser || !secondUser) {
    return false;
  }

  return firstUser.id === secondUser.id || firstUser.username === secondUser.username;
}
