import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { loadMyProducts } from "@/lib/products";
import { loadProfile } from "@/lib/profile";
import { loadOffers } from "@/lib/transfers";
import { cn } from "@/lib/utils";
import { OfferDirectory } from "./offer-directory";
import { PublishOfferForm } from "./publish-offer-form";

export default async function TransferBoardPage() {
  const [offers, profile, products] = await Promise.all([
    loadOffers(),
    loadProfile(),
    loadMyProducts(),
  ]);

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
          Publish stock you want to move, or accept an offer from another shop.
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
        <PublishOfferForm products={products ?? []} />
      )}
      <OfferDirectory
        offers={offers}
        myShopId={profile === null ? null : profile.shop.id}
      />
    </main>
  );
}
