import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  defaultLocale,
  getLocaleFromBrowserLanguage,
  isValidLocale,
} from "@/lib/i18n/config";

export default async function VisionIndexPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    redirect(`/vision/${cookieLocale}`);
  }

  const acceptLanguage = headerStore.get("accept-language");
  const browserLocale = getLocaleFromBrowserLanguage(acceptLanguage);
  if (isValidLocale(browserLocale)) {
    redirect(`/vision/${browserLocale}`);
  }

  redirect(`/vision/${defaultLocale}`);
}
