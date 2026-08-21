import { I18nProvider } from "@/i18n/client";
import { getServerTranslations } from "@/i18n/server";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { lng } = await getServerTranslations();

  return (
    <I18nProvider initialLng={lng}>
      {children}
    </I18nProvider>
  );
}
