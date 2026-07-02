"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { register as registerAccount } from "@/features/auth/api";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { registerFormSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { setToken, setUser } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

import { AuthField } from "./auth-field";
import { AuthShell } from "./auth-shell";

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });
  const registerMutation = useMutation({
    mutationFn: registerAccount,
    onSuccess(response) {
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user ?? null));
      router.replace("/");
    },
  });

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate({
      email: values.email,
      name: values.name,
      password: values.password,
      phone: values.phone?.trim() || undefined,
      username: values.username,
    });
  }

  return (
    <AuthShell title="Register">
      <form className="mt-7 space-y-5 sm:mt-9 sm:space-y-7" onSubmit={handleSubmit(onSubmit)}>
        <AuthField
          autoComplete="name"
          error={errors.name}
          label="Name"
          placeholder="Enter your name"
          registration={register("name")}
        />
        <AuthField
          autoComplete="email"
          error={errors.email}
          label="Email"
          placeholder="Enter your email"
          registration={register("email")}
          type="email"
        />
        <AuthField
          autoComplete="username"
          error={errors.username}
          label="Username"
          placeholder="Enter your username"
          registration={register("username")}
        />
        <AuthField
          autoComplete="tel"
          error={errors.phone}
          label="Number Phone"
          placeholder="Enter your number phone"
          registration={register("phone")}
          type="tel"
        />
        <AuthField
          autoComplete="new-password"
          error={errors.password}
          label="Password"
          placeholder="Enter your password"
          registration={register("password")}
          type="password"
        />
        <AuthField
          autoComplete="new-password"
          error={errors.confirmPassword}
          label="Confirm Password"
          placeholder="Enter your confirm password"
          registration={register("confirmPassword")}
          type="password"
        />

        {registerMutation.isError ? (
          <p className="text-sm font-medium text-[#d51b62]" role="alert">
            {getAuthErrorMessage(registerMutation.error)}
          </p>
        ) : null}

        <Button
          className="h-12 w-full rounded-full bg-primary text-base font-bold"
          disabled={registerMutation.isPending}
          type="submit"
        >
          {registerMutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </form>

      <p className="mt-6 text-center text-base font-semibold">
        Already have an account?{" "}
        <Link className="font-bold text-primary" href="/login">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
