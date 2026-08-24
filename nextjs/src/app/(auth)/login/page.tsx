"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Login from "@/views/Login";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuth();

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  const handleLoginSuccess = async () => {
    await checkAuth();
    router.push("/dashboard");
  };

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onGoToRegister={() => router.push("/register")}
      onGoToVerify={(email) =>
        router.push(`/verify-email${email ? `?email=${encodeURIComponent(email)}` : ""}`)
      }
      onGoToForgotPassword={(email) =>
        router.push(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`)
      }
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
