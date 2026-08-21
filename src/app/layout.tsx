import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerTranslations } from "@/i18n/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Recomp Core - Body Composition & Analytics",
  description: "Self-hosted body composition tracking, analytics, and segmental analysis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { lng } = await getServerTranslations();

  return (
    <html lang={lng} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#fafafa] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
