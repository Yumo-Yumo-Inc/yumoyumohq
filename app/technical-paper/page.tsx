import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  defaultLocale,
  getLocaleFromBrowserLanguage,
  isValidLocale,
} from "@/lib/i18n/config";

// /technical-paper (no language segment) picks the best locale for this visitor.
// Same auto-redirect strategy as /vision.
export default async function TechnicalPaperIndexPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get("locale")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    redirect(`/technical-paper/${cookieLocale}`);
  }

  const acceptLanguage = headerStore.get("accept-language");
  const browserLocale = getLocaleFromBrowserLanguage(acceptLanguage);
  if (isValidLocale(browserLocale)) {
    redirect(`/technical-paper/${browserLocale}`);
  }

  redirect(`/technical-paper/${defaultLocale}`);
}
