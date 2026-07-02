import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  defaultLocale,
  getLocaleFromBrowserLanguage,
  isValidLocale,
} from "@/lib/i18n/config";

// /academia (no language segment) picks the best locale for this visitor.
// Same auto-redirect strategy as /vision and /technical-paper.
export default async function AcademiaIndexPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    redirect(`/academia/${cookieLocale}`);
  }

  const acceptLanguage = headerStore.get("accept-language");
  const browserLocale = getLocaleFromBrowserLanguage(acceptLanguage);
  if (isValidLocale(browserLocale)) {
    redirect(`/academia/${browserLocale}`);
  }

  redirect(`/academia/${defaultLocale}`);
}
