"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../login/login.module.css";
import { apiErrorMessage, firstError, formText, productSchema } from "@/lib/validation";

export function CreateProductForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = productSchema.safeParse({
      name: formText(data, "name"),
      description: formText(data, "description"),
      quantity: formText(data, "quantity"),
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setPending(true);
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The product could not be created"));
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2>Add a product</h2>
      <label>
        Name
        <input name="name" type="text" />
      </label>
      <label>
        Description
        <input name="description" type="text" />
      </label>
      <label>
        Quantity
        <input name="quantity" type="text" inputMode="numeric" />
      </label>
      {error !== null ? <p>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add product"}
      </button>
    </form>
  );
}
