"use client";

import { useActionState } from "react";
import { uploadDesignAction } from "./actions";

export default function LibraryClient() {
  const [state, action, pending] = useActionState(uploadDesignAction, {});
  return (
    <form action={action} className="card" style={{ display: "grid", gap: ".8rem", gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }}>
      <label className="field" style={{ margin: 0 }}>
        <span className="label">Design name</span>
        <input className="input" name="name" placeholder="e.g. Ornamental snake" />
      </label>
      <label className="field" style={{ margin: 0 }}>
        <span className="label">Image (transparent PNG best)</span>
        <input className="input" name="file" type="file" accept="image/*" required />
      </label>
      <button className="btn btn-solid" disabled={pending}>{pending ? "Uploading…" : "Add design"}</button>
      {state.error && <p style={{ gridColumn: "1/-1", color: "var(--bad)", fontSize: ".85rem", margin: 0 }}>{state.error}</p>}
      {state.ok && <p style={{ gridColumn: "1/-1", color: "var(--good)", fontSize: ".85rem", margin: 0 }}>Added.</p>}
    </form>
  );
}
