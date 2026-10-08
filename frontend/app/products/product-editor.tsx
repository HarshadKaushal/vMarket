"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShelfProduct } from "@/lib/products";
import { apiErrorMessage, firstError, formText, productSchema } from "@/lib/validation";

export function ProductEditor({ product }: { product: ShelfProduct }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"save" | "delete" | null>(null);
  const pending = action !== null;
  const nameId = `product-${product.id}-name`;
  const descriptionId = `product-${product.id}-description`;
  const quantityId = `product-${product.id}-quantity`;

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

    setAction("save");
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setAction(null);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The product could not be updated"));
      return;
    }

    router.refresh();
  }

  async function onDelete() {
    setError(null);
    setAction("delete");
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    setAction(null);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The product could not be deleted"));
      return;
    }

    router.refresh();
  }

  return (
    <Card className="h-full">
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>Edit product</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            id={nameId}
            name="name"
            label="Name"
            defaultValue={product.name}
          />
          <Field
            id={descriptionId}
            name="description"
            label="Description"
            defaultValue={product.description}
          />
          <Field
            id={quantityId}
            name="quantity"
            label="Quantity"
            defaultValue={String(product.quantity)}
            inputMode="numeric"
          />
          {error !== null ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex-wrap gap-2">
          <Button type="submit" disabled={pending} className="h-9">
            {action === "save" ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={pending}
            className="h-9"
          >
            {action === "delete" ? "Deleting…" : "Delete"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
  inputMode,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  inputMode?: "numeric" | "decimal" | "text";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="h-9"
      />
    </div>
  );
}
