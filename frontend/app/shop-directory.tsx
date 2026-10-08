"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ShopCard = {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
};

type SortOrder = "name-asc" | "name-desc";

export function ShopDirectory({ shops }: { shops: ShopCard[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("name-asc");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = shops.filter((shop) => {
      if (needle.length === 0) {
        return true;
      }
      return (
        shop.name.toLowerCase().includes(needle) ||
        shop.address.toLowerCase().includes(needle)
      );
    });

    return matched.sort((a, b) => {
      const order = a.name.localeCompare(b.name);
      return sort === "name-asc" ? order : -order;
    });
  }, [query, shops, sort]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <Label htmlFor="shop-search">Search shops</Label>
          <Input
            id="shop-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or address"
            className="h-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "outline" }), "h-9")}
          >
            {sort === "name-asc" ? "Sort: Name A–Z" : "Sort: Name Z–A"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => {
                if (value === "name-asc" || value === "name-desc") {
                  setSort(value);
                }
              }}
            >
              <DropdownMenuRadioItem value="name-asc">
                Name A–Z
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">
                Name Z–A
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {shops.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shops yet.</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No shops match that search.
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((shop) => (
            <li key={shop.id}>
              <ShopCardView shop={shop} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShopCardView({ shop }: { shop: ShopCard }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3">
        <ShopMark name={shop.name} imageUrl={shop.imageUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug">
            <Link
              href={`/shops/${shop.id}`}
              className="text-foreground no-underline hover:text-primary"
            >
              {shop.name}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{shop.address}</p>
        </div>
      </CardHeader>
      <CardFooter>
        <Link
          href={`/shops/${shop.id}`}
          className={cn(buttonVariants({ size: "sm" }), "no-underline")}
        >
          View products
        </Link>
      </CardFooter>
    </Card>
  );
}

function ShopMark({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl !== null && imageUrl.length > 0 && !failed;

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {showImage ? (
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");

  return letters.toUpperCase();
}
