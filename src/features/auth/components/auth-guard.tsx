"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAppSelector } from "@/store/hooks";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { hydrated, token } = useAppSelector((state) => state.auth);
  const isAuthenticated = hydrated && Boolean(token);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, router, token]);

  if (!hydrated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
