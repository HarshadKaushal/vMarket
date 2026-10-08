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
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">Add a product</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="create-name" name="name" label="Name" />
          <Field id="create-description" name="description" label="Description" />
          <Field
            id="create-quantity"
            name="quantity"
            label="Quantity"
            inputMode="numeric"
          />
          {error !== null ? (
            <p className="text-sm text-destructive sm:col-span-3" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="h-9">
            {pending ? "Adding…" : "Add product"}
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
  inputMode,
}: {
  id: string;
  name: string;
  label: string;
  inputMode?: "numeric";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="text"
        inputMode={inputMode}
        className="h-9"
      />
    </div>
  );
}
