import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies, headers } from "next/headers";
import { AuthProvider } from "@/context/AuthContext";
import { resolveLanguage } from "@/lib/locale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Recomp Pro",
    template: "%s | Recomp Pro",
  },
  description: "Track and analyze your body composition and workout progress with Recomp Pro.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("recomp_pro_lang")?.value;
  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  const initialLang = resolveLanguage(langCookie, acceptLanguage);
  const enableWipPages = process.env.ENABLE_WIP_PAGES === "true";

  return (
    <html
      lang={initialLang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider initialLang={initialLang} enableWipPages={enableWipPages}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
