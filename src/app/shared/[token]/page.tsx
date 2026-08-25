"use client";

import { useParams } from "next/navigation";
import GuestSharedReport from "@/views/GuestSharedReport";

export default function SharedReportPage() {
  const params = useParams();
  const token = (params?.token as string) || "";

  return <GuestSharedReport token={token} />;
}
