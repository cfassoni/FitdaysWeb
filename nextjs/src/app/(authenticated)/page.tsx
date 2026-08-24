"use client";

import { useRouter } from "next/navigation";
import Dashboard from "@/views/Dashboard";

export default function RootPage() {
  const router = useRouter();
  return <Dashboard onNavigateToImport={() => router.push("/import")} />;
}
