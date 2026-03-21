"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { StatusBadge } from "@/components/ui/StatusBadge";

const items = [
  { href: "/", label: "Home" },
  { href: "/personal", label: "MyGoonClaw" },
  { href: "/goonclaw", label: "GoonClaw" },
  { href: "/goonstreams", label: "GoonConnect" },
  { href: "/goonbook", label: "GoonBook" },
  { href: "/agent", label: "Status" },
];

export function SiteNav() {
  const pathname = usePathname();
  const activeItem =
    items.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname.startsWith(`${item.href}/`)),
    ) ?? items[0];

  return (
    <nav className="site-nav panel">
      <div className="site-nav-copy">
        <p className="eyebrow">GoonClaw</p>
        <strong>Charts, streams, and access</strong>
        <p className="site-nav-summary">
          GoonClaw shows the live room. MyGoonClaw is your workspace. GoonConnect,
          GoonBook, and Status keep the rest of the app easy to browse.
        </p>
        <div className="route-badges">
          <StatusBadge tone="accent">Current: {activeItem.label}</StatusBadge>
          <StatusBadge tone="neutral">Live tools, easy to scan</StatusBadge>
        </div>
      </div>
      <div className="nav-links">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                ? "nav-link active"
                : "nav-link"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
