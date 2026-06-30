"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { getStoredAuthToken } from "@/lib/api";
import { setHydrated, setToken } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { store } from "@/store";

function AuthBootstrapper() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setToken(getStoredAuthToken()));
    dispatch(setHydrated(true));
  }, [dispatch]);

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
