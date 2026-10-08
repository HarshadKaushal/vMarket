import Link from "next/link";
import { apiUrl } from "@/lib/api";
import styles from "./page.module.css";

type Shop = {
  id: string;
  name: string;
  address: string;
};

async function loadShops(): Promise<Shop[]> {
  const response = await fetch(`${apiUrl()}/shops`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("The shop list could not be loaded");
  }

  return response.json() as Promise<Shop[]>;
}

export default async function Home() {
  const shops = await loadShops();

  return (
    <main className={styles.main}>
      <h1>Shops</h1>
      <p>Choose a shop to see its products.</p>
      {shops.length === 0 ? (
        <p>No shops yet.</p>
      ) : (
        <ul className={styles.list}>
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link href={`/shops/${shop.id}`}>{shop.name}</Link>
              <span>{shop.address}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
