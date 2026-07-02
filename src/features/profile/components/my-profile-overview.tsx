"use client";

import { LogOut, Mail, Phone, UserRound } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/use-logout";
import { useAppSelector } from "@/store/hooks";

const emptyStats = [
  { label: "Posts", value: 0 },
  { label: "Followers", value: 0 },
  { label: "Following", value: 0 },
  { label: "Likes", value: 0 },
];

export function MyProfileOverview() {
  const logout = useLogout();
  const user = useAppSelector((state) => state.auth.user);
  const stats = user?.counts
    ? [
        { label: "Posts", value: user.counts.post },
        { label: "Followers", value: user.counts.followers },
        { label: "Following", value: user.counts.following },
        { label: "Likes", value: user.counts.likes },
      ]
    : emptyStats;

  return (
    <section className="mx-auto w-full max-w-[632px] px-4 pb-28 pt-6 lg:pb-16 lg:pt-10">
      <div className="flex items-start gap-4">
        {user?.avatarUrl ? (
          <Image
            alt={user.name}
            className="size-20 rounded-full object-cover"
            height={80}
            src={user.avatarUrl}
            width={80}
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-secondary">
            <UserRound className="size-9 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-2xl font-bold">{user?.name ?? "Profile"}</p>
          <p className="mt-1 truncate text-base text-muted-foreground">
            {user?.username ? `@${user.username}` : "Signed in"}
          </p>
          {user?.bio ? <p className="mt-3 break-words text-sm leading-6 text-foreground">{user.bio}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div className="rounded-lg border border-border bg-secondary/40 p-4 text-center" key={stat.label}>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
        {user?.email ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Mail className="size-4" />
            <span className="truncate">{user.email}</span>
          </div>
        ) : null}
        {user?.phone ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Phone className="size-4" />
            <span className="truncate">{user.phone}</span>
          </div>
        ) : null}
        <Button className="mt-1 h-11 w-full rounded-full" onClick={logout} type="button" variant="outline">
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </section>
  );
}
