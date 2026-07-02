"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { login } from "@/features/auth/api";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { setToken, setUser } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

import { AuthField } from "./auth-field";
import { AuthShell } from "./auth-shell";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess(response) {
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user ?? null));
      router.replace("/");
    },
  });

  return (
    <AuthShell className="max-w-[446px]" title="Welcome Back!">
      <form className="mt-9 space-y-7" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
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

        {loginMutation.isError ? (
          <p className="text-sm font-medium text-[#d51b62]" role="alert">
            {getAuthErrorMessage(loginMutation.error)}
          </p>
        ) : null}

        <Button
          className="h-12 w-full rounded-full bg-primary text-base font-bold"
          disabled={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? "Logging in..." : "Login"}
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
