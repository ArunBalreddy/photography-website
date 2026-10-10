import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { adminSetup, isAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin sign in — PICTURESQUE",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}

async function Gate() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm setup={await adminSetup()} />;
}
