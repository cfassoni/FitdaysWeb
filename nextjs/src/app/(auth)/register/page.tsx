"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Register from "@/views/Register";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function RegisterContent() {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuth();

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  const handleRegisterSuccess = async () => {
    await checkAuth();
    router.push("/dashboard");
  };

  return (
    <Register
      onRegisterSuccess={handleRegisterSuccess}
      onGoToLogin={() => router.push("/login")}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
