"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { clearStoredAuthToken } from "@/lib/api";
import { clearSession } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(() => {
    clearStoredAuthToken();
    dispatch(clearSession());
    queryClient.clear();
    router.replace("/login");
  }, [dispatch, queryClient, router]);
}
