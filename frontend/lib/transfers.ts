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

export async function loadOffers(): Promise<OpenOffer[]> {
  const response = await fetch(`${apiUrl()}/transfers`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("The transfer board could not be loaded");
  }

  return response.json() as Promise<OpenOffer[]>;
}
