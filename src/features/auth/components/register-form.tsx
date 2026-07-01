"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { registerFormSchema, type RegisterFormValues } from "@/features/auth/schemas";

import { AuthField } from "./auth-field";
import { AuthShell } from "./auth-shell";

export function RegisterForm() {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  return (
    <AuthShell title="Register">
      <form className="mt-7 space-y-5 sm:mt-9 sm:space-y-7" onSubmit={handleSubmit(() => undefined)}>
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

        <Button className="h-12 w-full rounded-full bg-primary text-base font-bold" type="submit">
          Submit
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
