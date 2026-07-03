"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CreatePostForm } from "@/features/posts/components/create-post-form";
import { useAppSelector } from "@/store/hooks";

export function CreatePostView() {
  return (
    <>
      <CreatePostMobileHeader />
      <section className="mx-auto w-full max-w-[484px] px-4 pb-14 pt-6 lg:pb-24 lg:pt-12">
        <header className="mb-8 hidden items-center gap-4 lg:flex">
          <Link
            aria-label="Back to timeline"
            className="flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
            href="/"
          >
            <ArrowLeft className="size-7" />
          </Link>
          <h1 className="text-2xl font-bold">Add Post</h1>
        </header>

        <CreatePostForm />
      </section>
    </>
  );
}

function CreatePostMobileHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const viewerName = user?.name ?? user?.username ?? "Profile";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <Link
          aria-label="Back to timeline"
          className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
          href="/"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-lg font-bold">Add Post</h1>
      </div>

      <Link
        aria-label="Open profile"
        className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-foreground"
        href="/me"
      >
        {user?.avatarUrl ? (
          <Image alt={viewerName} className="size-full object-cover" height={40} src={user.avatarUrl} width={40} />
        ) : (
          <UserRound className="size-5" />
        )}
      </Link>
    </header>
  );
}
