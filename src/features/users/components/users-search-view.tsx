"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/features/users/api";
import { getNextUsersPageParam, getUsers } from "@/features/users/users-data";
import { queryKeys } from "@/lib/query-keys";
import type { UserSummary } from "@/lib/types";

const SEARCH_PAGE_SIZE = 12;

export function UsersSearchView() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
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

  return (
    <section className="mx-auto w-full max-w-[640px] px-4 pb-28 pt-6 lg:pb-20 lg:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Search Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">Find people by name or username.</p>
      </header>

      <label className="relative block">
        <span className="sr-only">Search users</span>
        <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoComplete="off"
          autoFocus
          className="h-12 rounded-full border-border bg-secondary pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            className="absolute right-4 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
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

      <div className="mt-6">
        {!shouldSearch ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <p className="text-base font-bold">Start with a keyword</p>
            <p className="mt-2 text-sm text-muted-foreground">Search results will appear here.</p>
          </div>
        ) : null}

        {usersQuery.isPending ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-secondary/40">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : null}

        {usersQuery.isError ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <p className="text-base font-bold">Unable to search</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {usersQuery.error instanceof Error ? usersQuery.error.message : "Please try again."}
            </p>
            <Button className="mt-4 rounded-full" onClick={() => usersQuery.refetch()} type="button">
              Retry
            </Button>
          </div>
        ) : null}

        {shouldSearch && !usersQuery.isPending && !usersQuery.isError && users.length === 0 ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-8 text-center">
            <p className="text-base font-bold">No results found</p>
            <p className="mt-2 text-sm text-muted-foreground">Change your keyword and try again.</p>
          </div>
        ) : null}

        {users.length > 0 ? (
          <div className="grid gap-3">
            {users.map((user) => (
              <UserSearchCard key={user.id} user={user} />
            ))}
          </div>
        ) : null}

        {usersQuery.hasNextPage ? (
          <div className="mt-6 flex justify-center">
            <Button
              className="h-11 rounded-full px-6"
              disabled={usersQuery.isFetchingNextPage}
              onClick={() => usersQuery.fetchNextPage()}
              type="button"
              variant="outline"
            >
              {usersQuery.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : null}
              {usersQuery.isFetchingNextPage ? "Loading" : "Load More"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function UserSearchCard({ user }: { user: UserSummary }) {
  return (
    <Link
      className="flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary"
      href={`/profile/${user.username}`}
    >
      <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
        {user.avatarUrl ? (
          <Image alt={user.name} className="object-cover" fill sizes="48px" src={user.avatarUrl} />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <UserRound className="size-6" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-bold">{user.name}</span>
        <span className="mt-1 block truncate text-sm text-muted-foreground">{user.username}</span>
      </span>
    </Link>
  );
}
