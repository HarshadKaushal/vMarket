import { cookies } from "next/headers";
import { apiUrl } from "./api";

export type Profile = {
  name: string;
  email: string;
  shop: {
    id: string;
    name: string;
  };
};

export async function loadProfile(): Promise<Profile | null> {
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader.length === 0) {
    return null;
  }

  const response = await fetch(`${apiUrl()}/auth/me`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("The account could not be loaded");
  }

  return response.json() as Promise<Profile>;
}
