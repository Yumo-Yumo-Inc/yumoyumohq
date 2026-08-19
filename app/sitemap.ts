import type { MetadataRoute } from "next";

const SITE_URL = "https://yumoyumo.com";

// Every URL below was verified live (curl → 200 with real rendered content)
// before being added — plan item 16. `/about` and the crawl files are also
// allowlisted in proxy.ts `landingPaths` — without that entry the proxy 404s
// them on the landing host. Locale-redirecting entries (`/vision`,
// `/technical-paper`) and `/app/` paths are excluded.
const PAPER_LOCALES = ["en", "tr", "es", "ru", "th", "zh"];

function url(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    url("/"),
    url("/faq"),
    url("/about"),
    url("/ledger"),
    url("/terms"),
    url("/privacy"),
    url("/support"),
    ...PAPER_LOCALES.map((lang) => url(`/vision/${lang}`)),
    ...PAPER_LOCALES.map((lang) => url(`/technical-paper/${lang}`)),
  ];
}
