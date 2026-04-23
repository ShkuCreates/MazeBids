"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { CardSkeleton } from "@/components/Skeleton";

const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
  loading: () => <div className="p-8 space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>,
  ssr: false
});

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [user, loading, router]);

  return (
    <Suspense fallback={<div className="p-8 space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}>
      {loading ? (
        <div className="p-8">Loading...</div>
      ) : !user || user.role !== "ADMIN" ? (
        null
      ) : (
        <AdminDashboard />
      )}
    </Suspense>
  );
}
