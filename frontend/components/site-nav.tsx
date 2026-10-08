import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { NavLinks } from "@/components/nav-links";
import { loadProfile } from "@/lib/profile";

export async function SiteNav() {
  const profile = await loadProfile();

  return (
    <header className="sticky top-0 z-20 border-b bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3">
        <Link
          href="/"
          prefetch={false}
          className="text-base font-semibold tracking-tight text-foreground no-underline"
        >
          VMarket
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLinks loggedIn={profile !== null} />
          {profile !== null ? (
            <>
              <span className="px-2 text-sm text-muted-foreground">
                {profile.shop.name}
              </span>
              <LogoutButton />
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
