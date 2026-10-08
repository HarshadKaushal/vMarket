"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <>
      {mine ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => send(`/api/transfers/${offer.id}/cancel`)}
        >
          {pending ? "Cancelling…" : "Cancel"}
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => send(`/api/transfers/${offer.id}/accept`)}
        >
          {pending ? "Accepting…" : "Accept"}
        </button>
      )}
      {error !== null ? <p>{error}</p> : null}
    </>
  );
}
