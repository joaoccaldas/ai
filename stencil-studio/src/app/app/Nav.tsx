"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/try", label: "New try-on" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/library", label: "Library" },
  { href: "/app/settings", label: "Settings" },
];

export default function Nav({ signOut }: { signOut: () => Promise<void> }) {
  const path = usePathname();
  return (
    <>
      <nav style={{ display: "flex", gap: "1.3rem", alignItems: "center", marginLeft: "1rem" }}>
        {LINKS.map((l) => {
          const active = l.href === "/app" ? path === "/app" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} className={`navlink${active ? " active" : ""}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} style={{ marginLeft: "auto" }}>
        <button className="btn btn-ghost btn-sm" type="submit">Sign out</button>
      </form>
    </>
  );
}
