"use client";

import { useState } from "react";

export default function ShareBar({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/s/${token}` : `/s/${token}`;
  return (
    <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
      <input className="input" readOnly value={url} style={{ flex: 1, minWidth: 220, fontSize: ".82rem" }} onFocus={(e) => e.target.select()} />
      <button
        className="btn btn-ghost btn-sm"
        onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {} }}
      >
        {copied ? "Copied ✓" : "Copy client link"}
      </button>
    </div>
  );
}
