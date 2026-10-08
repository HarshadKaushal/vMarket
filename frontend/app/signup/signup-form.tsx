"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../login/login.module.css";
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
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label>
        Your name
        <input name="name" type="text" autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
        />
      </label>
      <label>
        Shop name
        <input name="shopName" type="text" />
      </label>
      <label>
        Address
        <input name="address" type="text" />
      </label>
      <label>
        Image URL
        <input name="imageUrl" type="url" />
      </label>
      {error !== null ? <p>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
