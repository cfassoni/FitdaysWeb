"use client";

import Biometrics from "@/views/Biometrics";
import { useAuth } from "@/context/AuthContext";

export default function BiometricsPage() {
  const { setSharedLinksCount } = useAuth();
  return <Biometrics onLinksUpdated={setSharedLinksCount} />;
}
