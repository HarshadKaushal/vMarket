import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { loadMyProducts } from "@/lib/products";
import { cn } from "@/lib/utils";
import { CreateProductForm } from "./create-product-form";
import { ProductDirectory } from "./product-directory";

export default async function MyShelfPage() {
  const products = await loadMyProducts();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">My products</h1>
          {products !== null ? (
            <Badge variant="secondary">
              {products.length === 1 ? "1 product" : `${products.length} products`}
            </Badge>
          ) : null}
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add, edit, or remove products on your shelf.
        </p>
      </div>
      {products === null ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            Log in to manage your products.
          </p>
          <Link
            href="/login"
            className={cn(buttonVariants(), "no-underline")}
          >
            Log in
          </Link>
        </div>
      ) : (
        <>
          <CreateProductForm />
          <ProductDirectory products={products} />
        </>
      )}
    </main>
  );
}
