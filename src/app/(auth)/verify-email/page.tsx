"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VerifyEmail from "@/views/VerifyEmail";
import { Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  return (
    <VerifyEmail
      initialEmail={initialEmail}
      initialCode={initialCode}
      onGoToLogin={() => router.push("/login")}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
