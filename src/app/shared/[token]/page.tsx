import type { Metadata } from "next";
import GuestSharedReport from "@/views/GuestSharedReport";

export const metadata: Metadata = {
  title: "Shared Body Composition Report",
  description: "View a shared Recomp Pro body composition and progress report.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "Shared Body Composition Report | Recomp Pro",
    description: "View a shared Recomp Pro body composition and progress report.",
    type: "website",
  },
};

interface SharedReportPageProps {
  params: Promise<{ token: string }> | { token: string };
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const token = resolvedParams?.token || "";

  return <GuestSharedReport token={token} />;
}
