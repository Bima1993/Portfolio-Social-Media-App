import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ApiResponse, UserProfile } from "@/lib/types";

export function updateProfileIdentityQueries(
  queryClient: QueryClient,
  nextProfile: UserProfile,
  previousUsername?: string | null,
) {
  queryClient.setQueriesData<ApiResponse<UserProfile>>({ queryKey: queryKeys.profile.all }, (current) => {
    if (!current || !isSameProfile(current.data, nextProfile, previousUsername)) {
      return current;
    }

    return {
      ...current,
      data: mergeProfileIdentity(current.data, nextProfile),
    };
  });
}

export function mergeProfileIdentity(baseProfile: UserProfile, nextProfile: UserProfile) {
  return {
    ...baseProfile,
    ...nextProfile,
    avatarUrl: nextProfile.avatarUrl === undefined ? baseProfile.avatarUrl : nextProfile.avatarUrl,
    bio: nextProfile.bio === undefined ? baseProfile.bio : nextProfile.bio,
    counts: nextProfile.counts ?? baseProfile.counts,
    email: nextProfile.email ?? baseProfile.email,
    phone: nextProfile.phone === undefined ? baseProfile.phone : nextProfile.phone,
  };
}

function isSameProfile(
  currentProfile: UserProfile,
  nextProfile: UserProfile,
  previousUsername?: string | null,
) {
  return (
    currentProfile.id === nextProfile.id ||
    currentProfile.username === nextProfile.username ||
    (Boolean(previousUsername) && currentProfile.username === previousUsername)
  );
}
