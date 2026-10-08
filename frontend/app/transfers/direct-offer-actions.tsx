"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiErrorMessage } from "@/lib/validation";

export function DirectOfferActions({
  offerId,
  role,
}: {
  offerId: string;
  role: "incoming" | "outgoing";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"accept" | "reject" | "cancel" | null>(
    null,
  );

  async function send(action: "accept" | "reject" | "cancel") {
    setError(null);
    setPending(action);
    const response = await fetch(`/api/transfers/${offerId}/${action}`, {
      method: "POST",
    });
    setPending(null);

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      setError(apiErrorMessage(body, "The offer could not be updated"));
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {role === "incoming" ? (
          <>
            <Button
              type="button"
              disabled={pending !== null}
              className="h-9"
              onClick={() => send("accept")}
            >
              {pending === "accept" ? "Accepting…" : "Accept"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending !== null}
              className="h-9"
              onClick={() => send("reject")}
            >
              {pending === "reject" ? "Rejecting…" : "Reject"}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={pending !== null}
            className="h-9"
            onClick={() => send("cancel")}
          >
            {pending === "cancel" ? "Cancelling…" : "Cancel"}
          </Button>
        )}
      </div>
      {error !== null ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
