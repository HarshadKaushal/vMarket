"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./login.module.css";
import { apiErrorMessage, firstError, formText, loginSchema } from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formText(form, "email"),
      password: formText(form, "password"),
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "Login failed"));
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </label>
      {error !== null ? <p>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
