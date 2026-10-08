import { cookies } from "next/headers";
import { apiUrl } from "./api";

export type ShelfProduct = {
  id: string;
  name: string;
  description: string;
  quantity: number;
};

export async function loadMyProducts(): Promise<ShelfProduct[] | null> {
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader.length === 0) {
    return null;
  }

  const response = await fetch(`${apiUrl()}/products`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Your products could not be loaded");
  }

  return response.json() as Promise<ShelfProduct[]>;
}
