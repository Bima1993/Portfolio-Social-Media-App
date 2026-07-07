"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { getMe } from "@/features/profile/api";
import { ApiError, clearStoredAuthToken, getStoredAuthToken } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { clearSession, setHydrated, setToken, setUser } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { store } from "@/store";

function AuthBootstrapper() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      const token = getStoredAuthToken();

      if (!token) {
        dispatch(clearSession());
        dispatch(setHydrated(true));
        return;
      }

      dispatch(setToken(token));

      try {
        const response = await getMe();

        if (isMounted) {
          dispatch(setUser(response.data));
          queryClient.setQueryData(queryKeys.profile.me(), response);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearStoredAuthToken();

          if (isMounted) {
            dispatch(clearSession());
          }
        }
      } finally {
        if (isMounted) {
          dispatch(setHydrated(true));
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, queryClient]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrapper />
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
