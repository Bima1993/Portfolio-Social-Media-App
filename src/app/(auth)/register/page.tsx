import type { Metadata } from "next";

import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register | Sociality",
  description: "Create a Sociality account.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
