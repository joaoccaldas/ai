"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ActionState } from "./actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const isSignup = mode === "signup";

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link href="/" className="brand" style={{ display: "block", textAlign: "center", marginBottom: "1.6rem" }}>
          STEN<b>·</b>CIL <span style={{ fontSize: ".7rem", letterSpacing: ".2em", color: "var(--muted)" }}>STUDIO</span>
        </Link>
        <div className="card">
          <h1 className="serif" style={{ fontSize: "1.7rem", fontWeight: 400, marginBottom: ".3rem" }}>
            {isSignup ? "Start your free trial" : "Sign in"}
          </h1>
          <p className="muted" style={{ fontSize: ".9rem", marginBottom: "1.4rem", fontWeight: 300 }}>
            {isSignup ? "Set up your studio in under a minute." : "Welcome back."}
          </p>

          <form action={formAction}>
            {isSignup && (
              <label className="field">
                <span className="label">Studio name</span>
                <input className="input" name="studioName" placeholder="e.g. Ironside Tattoo Co." required />
              </label>
            )}
            <label className="field">
              <span className="label">Email</span>
              <input className="input" name="email" type="email" autoComplete="email" placeholder="you@studio.com" required />
            </label>
            <label className="field">
              <span className="label">Password</span>
              <input className="input" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} placeholder="••••••••" required minLength={8} />
            </label>

            {state.error && (
              <p style={{ color: "var(--bad)", fontSize: ".85rem", margin: "0 0 1rem" }}>{state.error}</p>
            )}

            <button className="btn btn-solid btn-block btn-lg" type="submit" disabled={pending}>
              {pending ? "Please wait…" : isSignup ? "Create studio" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="muted" style={{ textAlign: "center", fontSize: ".88rem", marginTop: "1.2rem" }}>
          {isSignup ? (
            <>Already have an account? <Link href="/login" style={{ color: "var(--gold)" }}>Sign in</Link></>
          ) : (
            <>New here? <Link href="/signup" style={{ color: "var(--gold)" }}>Start a free trial</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
