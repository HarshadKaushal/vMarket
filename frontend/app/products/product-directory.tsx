"use client";

import { useMemo, useState } from "react";
import type { ShelfProduct } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProductEditor } from "./product-editor";

type SortOrder = "name-asc" | "name-desc";

export function ProductDirectory({ products }: { products: ShelfProduct[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("name-asc");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = products.filter((product) => {
      if (needle.length === 0) {
        return true;
      }
      return (
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle)
      );
    });

    return matched.sort((a, b) => {
      const order = a.name.localeCompare(b.name);
      return sort === "name-asc" ? order : -order;
    });
  }, [products, query, sort]);

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No products yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-sm flex-col gap-1.5">
          <Label htmlFor="product-search">Search products</Label>
          <Input
            id="product-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or description"
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
          No products match that search.
        </p>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
          {visible.map((product) => (
            <li key={product.id}>
              <ProductEditor product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
