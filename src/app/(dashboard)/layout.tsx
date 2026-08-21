import { Navigation } from "@/components/Navigation";
import { I18nProvider } from "@/i18n/client";
import { getServerTranslations } from "@/i18n/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { lng } = await getServerTranslations();

  return (
    <I18nProvider initialLng={lng}>
      <div className="min-h-screen flex w-full">
        <Navigation />
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
          {children}
        </main>
      </div>
    </I18nProvider>
  );
}
