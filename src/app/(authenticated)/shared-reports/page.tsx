"use client";

import SharedReports from "@/views/SharedReports";
import { useAuth } from "@/context/AuthContext";

export default function SharedReportsPage() {
  const { setSharedLinksCount } = useAuth();
  return <SharedReports onLinksUpdated={setSharedLinksCount} />;
}
