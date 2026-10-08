"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/validation";
import type { OpenOffer } from "@/lib/transfers";

export function OfferActions({
  offer,
  myShopId,
}: {
  offer: OpenOffer;
  myShopId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mine = myShopId !== null && offer.sourceShopId === myShopId;

  async function send(path: string) {
    setError(null);
    setPending(true);
    const response = await fetch(path, { method: "POST" });
    setPending(false);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The offer could not be updated"));
      return;
    }

    router.refresh();
  }

  if (myShopId === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {mine ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="h-9"
          onClick={() => send(`/api/transfers/${offer.id}/cancel`)}
        >
          {pending ? "Cancelling…" : "Cancel"}
        </Button>
      ) : (
        <Button
          type="button"
          disabled={pending}
          className="h-9"
          onClick={() => send(`/api/transfers/${offer.id}/accept`)}
        >
          {pending ? "Accepting…" : "Accept"}
        </Button>
      )}
      {error !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
