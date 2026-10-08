import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { DirectOffer } from "@/lib/transfers";
import { DirectOfferActions } from "./direct-offer-actions";

export function DirectOffers({
  incoming,
  outgoing,
}: {
  incoming: DirectOffer[];
  outgoing: DirectOffer[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Private offers</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A private offer is visible to the shop that sent it and the shop it
          was sent to. The invited shop can accept or reject. The sender can
          cancel.
        </p>
      </div>
      <OfferGroup title="Sent to you" offers={incoming} role="incoming" />
      <OfferGroup title="You sent" offers={outgoing} role="outgoing" />
    </section>
  );
}

function OfferGroup({
  title,
  offers,
  role,
}: {
  title: string;
  offers: DirectOffer[];
  role: "incoming" | "outgoing";
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">None pending.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader className="gap-1">
                <div className="text-base font-semibold">{offer.productName}</div>
                <p className="text-sm text-muted-foreground">
                  {role === "incoming"
                    ? `From ${offer.sourceShopName}`
                    : `To ${offer.recipientShopName}`}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary">Qty {offer.quantity}</Badge>
                <Badge variant="secondary">{offer.unitPrice} each</Badge>
                <Badge variant="secondary">Total {offer.totalPrice}</Badge>
              </CardContent>
              <CardFooter>
                <DirectOfferActions offerId={offer.id} role={role} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
