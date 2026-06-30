import Link from "next/link";
import { ArrowRight, Compass, Layers3, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b pb-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">MVP scaffold</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Sociality</h1>
          </div>
          <Button asChild>
            <Link href="https://be-social-media-api-production.up.railway.app/api-swagger">
              API Docs
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </header>

        <div className="grid flex-1 content-center gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase text-primary">Next.js foundation ready</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              Project structure is ready for the Sociality frontend MVP.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              The app is scaffolded with the required stack, API utilities, global providers,
              Redux store, TanStack Query, and shadcn-compatible UI primitives.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                icon: ShieldCheck,
                title: "Auth foundation",
                text: "Token persistence and Redux session state are wired for login/register flows.",
              },
              {
                icon: Compass,
                title: "API client",
                text: "Base URL, bearer token attachment, pagination helpers, and typed errors are prepared.",
              },
              {
                icon: Layers3,
                title: "UI system",
                text: "Tailwind tokens and core shadcn-style components are ready to match the Figma design.",
              },
            ].map((item) => (
              <article
                className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
                key={item.title}
              >
                <item.icon className="size-5 text-primary" />
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
