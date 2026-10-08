"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../login/login.module.css";
import type { ShelfProduct } from "@/lib/products";
import {
  apiErrorMessage,
  firstError,
  formText,
  publishTransferSchema,
} from "@/lib/validation";

export function PublishOfferForm({ products }: { products: ShelfProduct[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = publishTransferSchema.safeParse({
      productId: formText(data, "productId"),
      quantity: formText(data, "quantity"),
      unitPrice: formText(data, "unitPrice"),
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setPending(true);
    const response = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The offer could not be published"));
      return;
    }

    form.reset();
    router.refresh();
  }

  if (products.length === 0) {
    return <p>Add a product on your shelf before publishing an offer.</p>;
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2>Publish an offer</h2>
      <label>
        Product
        <select name="productId" defaultValue="">
          <option value="" disabled>
            Choose a product
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.quantity} on shelf)
            </option>
          ))}
        </select>
      </label>
      <label>
        Quantity
        <input name="quantity" type="text" inputMode="numeric" />
      </label>
      <label>
        Unit price
        <input name="unitPrice" type="text" inputMode="decimal" />
      </label>
      {error !== null ? <p>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
