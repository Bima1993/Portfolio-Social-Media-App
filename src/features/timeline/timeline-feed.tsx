import { PostCard } from "./post-card";
import { timelinePosts } from "./mock-posts";

export function TimelineFeed() {
  return (
    <section className="mx-auto w-full max-w-[632px] px-4 pb-28 pt-4 sm:pt-8 lg:pb-16 lg:pt-10">
      <div className="grid gap-6">
        {timelinePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
