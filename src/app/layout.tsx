import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Recomp Core - Body Composition & Analytics",
  description: "Self-hosted body composition tracking, analytics, and segmental analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-[#fafafa] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navigation />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
