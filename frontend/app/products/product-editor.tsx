"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../login/login.module.css";
import type { ShelfProduct } from "@/lib/products";
import { apiErrorMessage, firstError, formText, productSchema } from "@/lib/validation";

export function ProductEditor({ product }: { product: ShelfProduct }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data = new FormData(event.currentTarget);
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
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The product could not be updated"));
      return;
    }

    router.refresh();
  }

  async function onDelete() {
    setError(null);
    setPending(true);
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The product could not be deleted"));
      return;
    }

    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label>
        Name
        <input name="name" type="text" defaultValue={product.name} />
      </label>
      <label>
        Description
        <input
          name="description"
          type="text"
          defaultValue={product.description}
        />
      </label>
      <label>
        Quantity
        <input
          name="quantity"
          type="text"
          inputMode="numeric"
          defaultValue={String(product.quantity)}
        />
      </label>
      {error !== null ? <p>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" className="danger" onClick={onDelete} disabled={pending}>
        Delete
      </button>
    </form>
  );
}
