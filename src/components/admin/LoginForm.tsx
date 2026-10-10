"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, type FormState } from "@/app/admin/actions";

const field =
  "w-full border-b border-line bg-transparent py-3 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

export default function LoginForm({ setup }: { setup: "ready" | "unconfigured" | "error" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [username, setUsername] = useState(""); // controlled, so it survives the form reset after a failed attempt

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex flex-col items-center text-center">
        <span className="relative mb-5 aspect-square w-20">
          <Image src="/brand/logo-ring.png" alt="" fill sizes="80px" className="logo-turn-header" />
          <Image src="/brand/logo-camera.png" alt="" fill sizes="80px" />
        </span>
        <p className="font-serif text-3xl font-semibold tracking-[0.2em]">PICTURESQUE</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-accent">Gallery admin</p>
      </div>

      {setup === "unconfigured" ? (
        <p className="border border-line bg-surface p-6 text-sm leading-relaxed text-muted">
          Admin sign-in isn&apos;t set up yet. Add <code className="text-foreground">ADMIN_USERNAME</code> and{" "}
          <code className="text-foreground">ADMIN_PASSWORD</code> in Vercel → Settings → Environment Variables, then
          redeploy.
        </p>
      ) : (
        <form action={action} className="space-y-6 border border-line bg-surface p-8">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Username</span>
            <input
              name="username"
              required
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Password</span>
            <input name="password" type="password" required autoComplete="current-password" className={field} />
          </label>
          {(state.error || setup === "error") && (
            <p role="alert" className="text-sm text-[#e57373]">
              {state.error ?? "Can't reach storage right now. Please try again in a moment."}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-accent py-4 text-xs font-medium uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/" className="hover:text-accent">
          ← Back to the website
        </Link>
      </p>
    </div>
  );
}
