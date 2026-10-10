import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminApp from "@/components/admin/AdminApp";
import { currentUsername, isAdmin } from "@/lib/admin-auth";
import { defaultManifest, getManifestForAdmin, type Manifest } from "@/lib/gallery";
import { storageMode } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Gallery admin — PICTURESQUE",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Loading the gallery…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  if (!(await isAdmin())) redirect("/admin/login");
  let manifest: Manifest;
  let loadError: string | undefined;
  try {
    manifest = await getManifestForAdmin();
  } catch (err) {
    // Never let a failed load be saved over the real gallery — the app goes read-only.
    manifest = defaultManifest();
    loadError = err instanceof Error ? err.message : "Couldn't load the saved gallery.";
  }
  return <AdminApp initial={manifest} storage={storageMode()} username={await currentUsername()} loadError={loadError} />;
}
