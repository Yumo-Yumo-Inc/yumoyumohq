import { headers } from "next/headers";
import WelcomePageClient from "./welcome-client";
import { SUPPORTED_LANGS, type Lang } from "./i18n";

function detectServerLang(headerList: Headers): Lang {
  const acceptLanguage = headerList.get("accept-language")?.toLowerCase() ?? "";
  if (!acceptLanguage) return "en";
  const supported = SUPPORTED_LANGS.map((l) => l.code);
  const tags = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase())
    .filter(Boolean);
  for (const tag of tags) {
    const short = tag.split("-")[0] as Lang;
    if (supported.includes(short)) return short;
  }
  return "en";
}

export default async function WelcomePage() {
  const headerList = await headers();
  const initialLang = detectServerLang(headerList);

  return <WelcomePageClient initialLang={initialLang} />;
}
