import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AdminApp, { type AdminTab } from "@/components/admin/AdminApp";
import { currentUsername, isAdmin } from "@/lib/admin-auth";
import { defaultManifest, getManifestForAdmin, type Manifest } from "@/lib/gallery";
import type { ReviewsAdminData } from "@/lib/review-shared";
import { loadReviewsForAdmin } from "@/lib/reviews";
import { storageMode } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Admin — PICTURESQUE",
  robots: { index: false, follow: false },
};

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Loading…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  if (!(await isAdmin())) redirect("/admin/login");
  const tab: AdminTab = (await searchParams).tab === "reviews" ? "reviews" : "gallery";
  let manifest: Manifest;
  let loadError: string | undefined;
  try {
    manifest = await getManifestForAdmin();
  } catch (err) {
    // Never let a failed load be saved over the real gallery — the app goes read-only.
    manifest = defaultManifest();
    loadError = err instanceof Error ? err.message : "Couldn't load the saved gallery.";
  }
  let reviews: ReviewsAdminData | null = null;
  let reviewsError: string | undefined;
  try {
    reviews = await loadReviewsForAdmin();
  } catch (err) {
    reviewsError = `Couldn't load reviews (${err instanceof Error ? err.message : "unknown error"}). Try "Check for new".`;
  }
  return (
    <AdminApp
      initial={manifest}
      storage={storageMode()}
      username={await currentUsername()}
      loadError={loadError}
      reviews={reviews}
      reviewsError={reviewsError}
      initialTab={tab}
    />
  );
}
