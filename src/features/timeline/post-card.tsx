import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";

import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="border-b border-border pb-8">
      <header className="mb-3 flex items-center gap-3">
        <Link className="relative size-12 shrink-0 overflow-hidden rounded-full" href={`/profile/${post.author.username}`}>
          <Image
            alt={post.author.name}
            className="object-cover"
            fill
            sizes="48px"
            src={post.author.avatarUrl ?? "/globe.svg"}
          />
        </Link>
        <div className="min-w-0">
          <Link className="block truncate text-base font-bold text-foreground" href={`/profile/${post.author.username}`}>
            {post.author.name}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{post.createdAt}</p>
        </div>
      </header>

      <Link className="relative block aspect-square overflow-hidden rounded-lg bg-secondary" href={`/posts/${post.id}`}>
        <Image
          alt={post.caption ?? "Sociality post image"}
          className="object-cover"
          fill
          priority={post.id === 1}
          sizes="(max-width: 640px) calc(100vw - 32px), 600px"
          src={post.imageUrl}
        />
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm font-semibold" type="button" aria-label="Like post">
            <Heart className={cn("size-6", post.likedByMe && "fill-[#d51b62] text-[#d51b62]")} />
            {post.likeCount}
          </button>
          <button className="flex items-center gap-2 text-sm font-semibold" type="button" aria-label="View comments">
            <MessageCircle className="size-6" />
            {post.commentCount}
          </button>
          <button className="flex items-center gap-2 text-sm font-semibold" type="button" aria-label="Share post">
            <Send className="size-6" />
            20
          </button>
        </div>

        <button type="button" aria-label="Save post">
          <Bookmark className={cn("size-7", post.savedByMe && "fill-foreground")} />
        </button>
      </div>

      <div className="mt-4 space-y-2 text-[15px] leading-7">
        <Link className="block font-bold" href={`/profile/${post.author.username}`}>
          {post.author.name}
        </Link>
        <p className="break-words text-foreground">{post.caption}</p>
        <button className="text-base font-semibold text-primary" type="button">
          Show More
        </button>
      </div>
    </article>
  );
}
