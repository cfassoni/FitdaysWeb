"use client";

import History from "@/views/History";
import { useAuth } from "@/context/AuthContext";

export default function HistoryPage() {
  const { setSharedLinksCount } = useAuth();
  return <History onLinksUpdated={setSharedLinksCount} />;
}
