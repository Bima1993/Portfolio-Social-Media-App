import Link from "next/link";

import { cn } from "@/lib/utils";

type SocialityMarkProps = {
  className?: string;
};

type SocialityLogoProps = {
  className?: string;
  href?: string;
  markClassName?: string;
  textClassName?: string;
};

export function SocialityMark({ className }: SocialityMarkProps) {
  const rays = Array.from({ length: 16 });

  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0 text-white", className)}
      fill="none"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        {rays.map((_, index) => (
          <rect
            height="86"
            key={index}
            rx="4"
            transform={`rotate(${index * 22.5} 100 100)`}
            width="18"
            x="91"
            y="0"
          />
        ))}
        <circle cx="100" cy="100" r="46" />
      </g>
    </svg>
  );
}

export function SocialityLogo({
  className,
  href,
  markClassName,
  textClassName,
}: SocialityLogoProps) {
  const content = (
    <>
      <SocialityMark className={cn("size-8", markClassName)} />
      <span className={cn("text-2xl font-bold tracking-normal", textClassName)}>Sociality</span>
    </>
  );

  if (href) {
    return (
      <Link className={cn("flex w-fit items-center gap-3", className)} href={href}>
        {content}
      </Link>
    );
  }

  return <div className={cn("flex w-fit items-center gap-3", className)}>{content}</div>;
}
