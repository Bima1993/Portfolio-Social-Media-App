"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { searchUsers } from "@/features/users/api";
import { getNextUsersPageParam, getUsers } from "@/features/users/users-data";
import { queryKeys } from "@/lib/query-keys";
import type { UserSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type UserSearchProps = {
  className?: string;
  inputClassName?: string;
  onResultClick?: () => void;
  openOnFocus?: boolean;
  placeholder?: string;
  variant?: "desktop" | "mobile";
};

const SEARCH_PAGE_SIZE = 8;

export function UserSearch({
  className,
  inputClassName,
  onResultClick,
  openOnFocus = true,
  placeholder = "Search",
  variant = "desktop",
}: UserSearchProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const normalizedQuery = debouncedQuery.trim();
  const shouldSearch = normalizedQuery.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const usersQuery = useInfiniteQuery({
    queryKey: queryKeys.users.search(normalizedQuery),
    queryFn: ({ pageParam }) => searchUsers(normalizedQuery, Number(pageParam), SEARCH_PAGE_SIZE),
    enabled: shouldSearch,
    initialPageParam: 1,
    getNextPageParam: getNextUsersPageParam,
  });
  const users = useMemo(() => usersQuery.data?.pages.flatMap(getUsers) ?? [], [usersQuery.data]);
  const panelOpen = shouldSearch && (variant === "mobile" || focused || openOnFocus);

  function closeResults() {
    setFocused(false);
    onResultClick?.();
  }

  return (
    <div className={cn("relative", className)}>
      <label className="relative block" htmlFor={inputId}>
        <span className="sr-only">Search users</span>
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoComplete="off"
          className={cn(
            "h-12 rounded-full border-border bg-secondary pl-12 pr-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0",
            inputClassName,
          )}
          id={inputId}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 140);
          }}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            type="button"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </label>

      {panelOpen ? (
        <div
          className={cn(
            "z-[70] overflow-hidden rounded-lg border border-border bg-secondary shadow-2xl shadow-black/50",
            variant === "desktop"
              ? "absolute left-0 top-[calc(100%+8px)] w-full"
              : "mt-3 min-h-[220px]",
          )}
        >
          {usersQuery.isPending ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          ) : null}

          {usersQuery.isError ? (
            <div className="px-4 py-7 text-center">
              <p className="text-sm font-bold">Unable to search</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {usersQuery.error instanceof Error ? usersQuery.error.message : "Please try again."}
              </p>
            </div>
          ) : null}

          {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center px-4 text-center">
              <p className="text-sm font-bold">No results found</p>
              <p className="mt-2 text-xs text-muted-foreground">Change your keyword</p>
            </div>
          ) : null}

          {users.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto py-2">
              {users.map((user) => (
                <UserSearchResult key={user.id} onClick={closeResults} user={user} />
              ))}

              {usersQuery.hasNextPage ? (
                <button
                  className="flex h-10 w-full items-center justify-center text-sm font-bold text-primary transition-colors hover:bg-muted"
                  disabled={usersQuery.isFetchingNextPage}
                  onClick={() => usersQuery.fetchNextPage()}
                  type="button"
                >
                  {usersQuery.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : "Load More"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function UserSearchResult({ onClick, user }: { onClick: () => void; user: UserSummary }) {
  return (
    <Link
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted"
      href={`/profile/${user.username}`}
      onClick={onClick}
    >
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {user.avatarUrl ? (
          <Image alt={user.name} className="object-cover" fill sizes="40px" src={user.avatarUrl} />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <UserRound className="size-5" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{user.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{user.username}</span>
      </span>
    </Link>
  );
}
