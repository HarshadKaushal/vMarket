"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

export function NavLinks({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const items: NavItem[] = [
    {
      href: "/",
      label: "Shops",
      isActive: (path) => path === "/" || path.startsWith("/shops"),
    },
    {
      href: "/transfers",
      label: "Transfers",
      isActive: (path) => path.startsWith("/transfers"),
    },
    ...(loggedIn
      ? [
          {
            href: "/products",
            label: "My products",
            isActive: (path: string) => path.startsWith("/products"),
          },
        ]
      : [
          {
            href: "/login",
            label: "Log in",
            isActive: (path: string) => path.startsWith("/login"),
          },
          {
            href: "/signup",
            label: "Sign up",
            isActive: (path: string) => path.startsWith("/signup"),
          },
        ]),
  ];

  return (
    <>
      {items.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
