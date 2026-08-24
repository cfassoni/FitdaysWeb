"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResetPassword from "@/views/ResetPassword";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";
  const initialToken = searchParams.get("token") || "";
  const { checkAuth } = useAuth();

  const handleResetSuccess = async () => {
    await checkAuth();
    router.push("/dashboard");
  };

  return (
    <ResetPassword
      initialEmail={initialEmail}
      initialCode={initialCode}
      initialToken={initialToken}
      onResetSuccess={handleResetSuccess}
      onGoToLogin={() => router.push("/login")}
      onGoToForgotPassword={() => router.push("/forgot-password")}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
