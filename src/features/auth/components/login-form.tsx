"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";

import { AuthField } from "./auth-field";
import { AuthShell } from "./auth-shell";

export function LoginForm() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <AuthShell className="max-w-[446px]" title="Welcome Back!">
      <form className="mt-9 space-y-7" onSubmit={handleSubmit(() => undefined)}>
        <AuthField
          autoComplete="email"
          error={errors.email}
          label="Email"
          placeholder="Enter your email"
          registration={register("email")}
          type="email"
        />
        <AuthField
          autoComplete="current-password"
          error={errors.password}
          label="Password"
          placeholder="Enter your password"
          registration={register("password")}
          type="password"
        />

        <Button className="h-12 w-full rounded-full bg-primary text-base font-bold" type="submit">
          Login
        </Button>
      </form>

      <p className="mt-6 text-center text-base font-semibold">
        Don&apos;t have an account?{" "}
        <Link className="font-bold text-primary" href="/register">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
