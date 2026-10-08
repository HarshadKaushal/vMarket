"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpenOffer } from "@/lib/transfers";
import { cn } from "@/lib/utils";
import { OfferActions } from "./offer-actions";

type SortOrder = "name-asc" | "name-desc";

export function OfferDirectory({
  offers,
  myShopId,
}: {
  offers: OpenOffer[];
  myShopId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("name-asc");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = offers.filter((offer) => {
      if (needle.length === 0) {
        return true;
      }
      return (
        offer.productName.toLowerCase().includes(needle) ||
        offer.sourceShopName.toLowerCase().includes(needle) ||
        offer.productDescription.toLowerCase().includes(needle)
      );
    });

    return matched.sort((a, b) => {
      const order = a.productName.localeCompare(b.productName);
      return sort === "name-asc" ? order : -order;
    });
  }, [offers, query, sort]);

  if (offers.length === 0) {
    return <p className="text-sm text-muted-foreground">No open offers.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <Label htmlFor="offer-search">Search offers</Label>
          <Input
            id="offer-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Product, shop, or description"
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
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No offers match that search.
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} myShopId={myShopId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OfferCard({
  offer,
  myShopId,
}: {
  offer: OpenOffer;
  myShopId: string | null;
}) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initials(offer.sourceShopName)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug">
            {offer.productName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            from {offer.sourceShopName}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {offer.productDescription.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {offer.productDescription}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Qty {offer.quantity}</Badge>
          <Badge variant="outline">{offer.unitPrice} each</Badge>
          <Badge variant="outline">Total {offer.totalPrice}</Badge>
        </div>
      </CardContent>
      {myShopId !== null ? (
        <CardFooter>
          <OfferActions offer={offer} myShopId={myShopId} />
        </CardFooter>
      ) : null}
    </Card>
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
