"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/launchonomics", label: "LaunchONomics" },
  { href: "/goonclaw", label: "Personal" },
  { href: "/livestream", label: "Livestream" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="site-nav panel">
      <div>
        <p className="eyebrow">GoonClaw</p>
        <strong>Tokenized agent control surfaces</strong>
      </div>
      <div className="nav-links">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "nav-link active" : "nav-link"}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
