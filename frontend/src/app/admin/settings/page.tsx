"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import FeaturedAuctions from "@/components/admin/FeaturedAuctions";
import AuctionScheduler from "@/components/admin/AuctionScheduler";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <FeaturedAuctions />
        <AuctionScheduler />
      </div>
    </AdminLayout>
  );
}
