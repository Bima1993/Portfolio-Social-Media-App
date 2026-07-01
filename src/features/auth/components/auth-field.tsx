"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  autoComplete?: string;
  error?: FieldError;
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  type?: "email" | "password" | "tel" | "text";
};

export function AuthField({
  autoComplete,
  error,
  label,
  placeholder,
  registration,
  type = "text",
}: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <label className="block">
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="relative mt-2 block">
        <Input
          autoComplete={autoComplete}
          className={cn(
            "h-12 rounded-xl border-border bg-secondary px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0",
            isPassword && "pr-12",
            error && "border-[#d51b62] focus-visible:border-[#d51b62]",
          )}
          placeholder={placeholder}
          type={inputType}
          {...registration}
        />
        {isPassword ? (
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center text-muted-foreground"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-2 block text-sm text-[#d51b62]">{error.message}</span> : null}
    </label>
  );
}
