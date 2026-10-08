import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/lib/api";
import { ShopDirectory, type ShopCard } from "./shop-directory";

async function loadShops(): Promise<ShopCard[]> {
  const response = await fetch(`${apiUrl()}/shops`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("The shop list could not be loaded");
  }

  const shops = (await response.json()) as ShopCard[];
  return shops.map((shop) => ({
    id: shop.id,
    name: shop.name,
    address: shop.address,
    imageUrl: shop.imageUrl ?? null,
  }));
}

export default async function Home() {
  const shops = await loadShops();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Explore Shops
          </h1>
          <Badge variant="secondary">
            {shops.length === 1 ? "1 shop" : `${shops.length} shops`}
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Choose a shop to see what it has on the shelf.
        </p>
      </div>
      <ShopDirectory shops={shops} />
    </main>
  );
}
