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
import {
  apiErrorMessage,
  firstError,
  formText,
  publishTransferSchema,
} from "@/lib/validation";

export function PublishOfferForm({
  products,
  shops,
}: {
  products: ShelfProduct[];
  shops: { id: string; name: string }[];
}) {
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
      recipientShopId: formText(data, "recipientShopId"),
    });

    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    const payload = {
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      ...(parsed.data.recipientShopId.length > 0
        ? { recipientShopId: parsed.data.recipientShopId }
        : {}),
    };

    setPending(true);
    const response = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    return (
      <p className="text-sm text-muted-foreground">
        Add a product on your shelf before publishing an offer.
      </p>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">Publish an offer</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer-product">Product</Label>
            <select
              id="offer-product"
              name="productId"
              defaultValue=""
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="" disabled>
                Choose a product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.quantity} on shelf)
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer-quantity">Quantity</Label>
            <Input
              id="offer-quantity"
              name="quantity"
              type="text"
              inputMode="numeric"
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer-recipient">Send to</Label>
            <select
              id="offer-recipient"
              name="recipientShopId"
              defaultValue=""
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Everyone on the open board</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} only
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="offer-price">Unit price</Label>
            <Input
              id="offer-price"
              name="unitPrice"
              type="text"
              inputMode="decimal"
              className="h-9"
            />
          </div>
          {error !== null ? (
            <p className="text-sm text-destructive sm:col-span-2 lg:col-span-4" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending} className="h-9">
            {pending ? "Publishing…" : "Publish"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
