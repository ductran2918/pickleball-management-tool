"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Overview" },
  { href: "/members", label: "Members" },
  { href: "/sessions", label: "Sessions" },
  { href: "/costs", label: "Costs" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Primary">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-amber-300 text-stone-950 shadow-[0_12px_30px_rgba(251,191,36,0.28)]"
                : "border border-white/10 bg-white/5 text-stone-300 hover:border-amber-300/30 hover:text-white",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
