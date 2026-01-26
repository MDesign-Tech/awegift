import RoleProtectedRoute from "@/components/auth/RoleProtectedRoute";
import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";
import { generateSEO } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generateSEO({
  title: "Dashboard",
  description: "Admin dashboard for managing the e-commerce platform.",
  noindex: true,
  nofollow: true,
  url: "/dashboard",
});

export default function DashboardPage() {
  return (
      <DashboardOverviewClient />
  );
}