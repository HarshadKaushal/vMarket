import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { loadProfile } from "@/lib/profile";

export async function SiteNav() {
  const profile = await loadProfile();

  return (
    <header className="site-header">
      <Link className="site-name" href="/">
        VMarket
      </Link>
      <nav>
        <Link href="/">Shops</Link>
        <Link href="/transfers">Transfers</Link>
        {profile === null ? (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        ) : (
          <>
            <Link href="/products">My products</Link>
            <span className="signed-in">{profile.shop.name}</span>
            <LogoutButton />
          </>
        )}
      </nav>
    </header>
  );
}
