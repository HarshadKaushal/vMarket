import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";
import { loadMyProducts } from "@/lib/products";
import { loadProfile } from "@/lib/profile";
import { loadDirectOffers, loadOffers } from "@/lib/transfers";
import { cn } from "@/lib/utils";
import { DirectOffers } from "./direct-offers";
import { OfferDirectory } from "./offer-directory";
import { PublishOfferForm } from "./publish-offer-form";

type ShopChoice = { id: string; name: string };

async function loadShopChoices(): Promise<ShopChoice[]> {
  const response = await fetch(`${apiUrl()}/shops`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("The shop list could not be loaded");
  }

  const shops = (await response.json()) as ShopChoice[];
  return shops.map((shop) => ({ id: shop.id, name: shop.name }));
}

export default async function TransferBoardPage() {
  const [offers, profile, products, shops, directOffers] = await Promise.all([
    loadOffers(),
    loadProfile(),
    loadMyProducts(),
    loadShopChoices(),
    loadDirectOffers(),
  ]);
  const otherShops =
    profile === null
      ? []
      : shops.filter((shop) => shop.id !== profile.shop.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Transfers</h1>
          <Badge variant="secondary">
            {offers.length === 1 ? "1 open offer" : `${offers.length} open offers`}
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Publish stock on the open board, or send a private offer to one shop.
        </p>
      </div>
      {profile === null ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Log in to publish or accept an offer.
          </p>
          <Link href="/login" className={cn(buttonVariants(), "no-underline")}>
            Log in
          </Link>
        </div>
      ) : (
        <PublishOfferForm products={products ?? []} shops={otherShops} />
      )}
      {profile !== null ? (
        <DirectOffers
          incoming={directOffers.incoming}
          outgoing={directOffers.outgoing}
        />
      ) : null}
      <OfferDirectory
        offers={offers}
        myShopId={profile === null ? null : profile.shop.id}
      />
    </main>
  );
}
