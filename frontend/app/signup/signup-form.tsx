"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage, firstError, formText, signupSchema } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = signupSchema.safeParse({
      name: formText(form, "name"),
      email: formText(form, "email"),
      password: formText(form, "password"),
      shopName: formText(form, "shopName"),
      address: formText(form, "address"),
      imageUrl: formText(form, "imageUrl"),
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "Signup failed"));
      return;
    }

    router.push("/login");
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <Field id="name" label="Your name" autoComplete="name" />
      <Field id="email" label="Email" type="email" autoComplete="username" />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
      />
      <Field id="shopName" label="Shop name" />
      <Field id="address" label="Address" />
      <Field id="imageUrl" label="Image URL" type="url" />
      {error !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-9 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="h-9"
      />
    </div>
  );
}
