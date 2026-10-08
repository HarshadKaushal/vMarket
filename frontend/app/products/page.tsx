import Link from "next/link";
import { loadMyProducts } from "@/lib/products";
import styles from "../page.module.css";
import { CreateProductForm } from "./create-product-form";
import { ProductEditor } from "./product-editor";

export default async function MyShelfPage() {
  const products = await loadMyProducts();

  return (
    <main className={styles.main}>
      <h1>My products</h1>
      {products === null ? (
        <p>
          <Link href="/login">Log in</Link> to manage your products.
        </p>
      ) : (
        <>
          <CreateProductForm />
          {products.length === 0 ? (
            <p>No products yet.</p>
          ) : (
            <ul className={styles.list}>
              {products.map((product) => (
                <li key={product.id}>
                  <ProductEditor product={product} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
