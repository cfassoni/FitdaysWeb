"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ForgotPassword from "@/views/ForgotPassword";
import { Loader2 } from "lucide-react";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  return (
    <ForgotPassword
      initialEmail={initialEmail}
      onGoToLogin={() => router.push("/login")}
      onGoToReset={(email, code) => {
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (code) params.set("code", code);
        router.push(`/reset-password?${params.toString()}`);
      }}
    />
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
