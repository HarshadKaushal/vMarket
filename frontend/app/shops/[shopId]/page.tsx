import { notFound } from "next/navigation";
import { apiUrl } from "@/lib/api";
import styles from "../../page.module.css";

type Shop = {
  id: string;
  name: string;
  address: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  quantity: number;
};

export default async function ShopProductsPage({
  params,
}: PageProps<"/shops/[shopId]">) {
  const { shopId } = await params;

  if (!/^\d+$/.test(shopId)) {
    notFound();
  }

  const [shopsResponse, productsResponse] = await Promise.all([
    fetch(`${apiUrl()}/shops`, { cache: "no-store" }),
    fetch(`${apiUrl()}/shops/${shopId}/products`, { cache: "no-store" }),
  ]);

  if (productsResponse.status === 404 || productsResponse.status === 400) {
    notFound();
  }

  if (!shopsResponse.ok || !productsResponse.ok) {
    throw new Error("The product list could not be loaded");
  }

  const shops = (await shopsResponse.json()) as Shop[];
  const products = (await productsResponse.json()) as Product[];
  const shop = shops.find((item) => item.id === shopId);

  if (shop === undefined) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <h1>{shop.name}</h1>
      <p>{shop.address}</p>
      {products.length === 0 ? (
        <p>No products yet.</p>
      ) : (
        <ul className={styles.list}>
          {products.map((product) => (
            <li key={product.id}>
              <strong>{product.name}</strong>
              {product.description.length > 0 ? (
                <span>{product.description}</span>
              ) : null}
              <span>Quantity {product.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
