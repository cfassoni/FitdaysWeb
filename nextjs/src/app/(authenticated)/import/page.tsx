"use client";

import { useRouter } from "next/navigation";
import Import from "@/views/Import";

export default function ImportPage() {
  const router = useRouter();
  return <Import onImportSuccess={() => router.push("/dashboard")} />;
}
