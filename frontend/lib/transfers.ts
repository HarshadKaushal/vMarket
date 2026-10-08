import { cookies } from "next/headers";
import { apiUrl } from "./api";

export type OpenOffer = {
  id: string;
  sourceShopId: string;
  sourceShopName: string;
  sourceProductId: string;
  productName: string;
  productDescription: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
};

export type DirectOffer = OpenOffer & {
  recipientShopId: string;
  recipientShopName: string;
};

export type DirectOfferLists = {
  incoming: DirectOffer[];
  outgoing: DirectOffer[];
};

export async function loadOffers(): Promise<OpenOffer[]> {
  const response = await fetch(`${apiUrl()}/transfers`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("The transfer board could not be loaded");
  }

  return response.json() as Promise<OpenOffer[]>;
}

export async function loadDirectOffers(): Promise<DirectOfferLists> {
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader.length === 0) {
    return { incoming: [], outgoing: [] };
  }

  const response = await fetch(`${apiUrl()}/transfers/direct`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) {
    return { incoming: [], outgoing: [] };
  }

  if (!response.ok) {
    throw new Error("Private offers could not be loaded");
  }

  return response.json() as Promise<DirectOfferLists>;
}
