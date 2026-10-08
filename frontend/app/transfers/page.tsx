import Link from "next/link";
import { loadMyProducts } from "@/lib/products";
import { loadProfile } from "@/lib/profile";
import { loadOffers } from "@/lib/transfers";
import styles from "../page.module.css";
import { OfferActions } from "./offer-actions";
import { PublishOfferForm } from "./publish-offer-form";

export default async function TransferBoardPage() {
  const [offers, profile, products] = await Promise.all([
    loadOffers(),
    loadProfile(),
    loadMyProducts(),
  ]);

  return (
    <main className={styles.main}>
      <h1>Transfers</h1>
      {profile === null ? (
        <p>
          <Link href="/login">Log in</Link> to publish or accept an offer.
        </p>
      ) : (
        <PublishOfferForm products={products ?? []} />
      )}
      {offers.length === 0 ? (
        <p>No open offers.</p>
      ) : (
        <ul className={styles.list}>
          {offers.map((offer) => (
            <li key={offer.id}>
              <strong>
                {offer.productName} from {offer.sourceShopName}
              </strong>
              {offer.productDescription.length > 0 ? (
                <span>{offer.productDescription}</span>
              ) : null}
              <span>
                {offer.quantity} at {offer.unitPrice} each, total{" "}
                {offer.totalPrice}
              </span>
              <OfferActions
                offer={offer}
                myShopId={profile === null ? null : profile.shop.id}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
