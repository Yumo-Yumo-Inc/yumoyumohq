"use client"

import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";

const content = {
  en: {
    title: "About Yumo Yumo",
    companyTitle: "Company",
    company: "Yumo Yumo Inc. is incorporated in Delaware, United States. It develops software for receipt processing, price observation, and household-spending analysis.",
    founderTitle: "Founder",
    // Keep in sync with messages/{locale}.json founder.bio (landing founder card).
    founder: "Yumo Yumo was founded by Uğur Alacakapı, an international economics graduate with eight years of blockchain-protocol research experience.",
    researchTitle: "Research input",
    research: "Field research in Southeast Asia informs receipt-format support, merchant resolution, canonical taxonomy, and product decisions. Research observations are inputs to these systems; they are not presented as independent market claims.",
    papers: "Read the technical paper",
  },
  tr: {
    title: "Yumo Yumo Hakkında",
    companyTitle: "Şirket",
    company: "Yumo Yumo Inc., Amerika Birleşik Devletleri Delaware'de kuruludur. Şirket; fiş işleme, fiyat gözlemi ve hane harcaması analizi için yazılım geliştirir.",
    founderTitle: "Kurucu",
    // Keep in sync with messages/{locale}.json founder.bio (landing founder card).
    founder: "Yumo Yumo, uluslararası ekonomi mezunu ve sekiz yıllık blockchain protokol araştırması deneyimine sahip Uğur Alacakapı tarafından kurulmuştur.",
    researchTitle: "Araştırma girdisi",
    research: "Güneydoğu Asya'daki saha araştırması; fiş biçimi desteği, satıcı çözümlemesi, kanonik taksonomi ve ürün kararlarına girdi sağlar. Bu gözlemler bağımsız pazar iddiası olarak sunulmaz.",
    papers: "Teknik dokümanı okuyun",
  },
} as const;

export default function AboutPage() {
  const { locale } = useLocale();
  const copy = content[locale === "tr" ? "tr" : "en"];

  return (
    <main className="min-h-screen px-4 py-16 text-white sm:py-24">
      <article className="mx-auto max-w-3xl space-y-10">
        <header>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        </header>

        <section>
          <h2 className="text-xl font-semibold">{copy.companyTitle}</h2>
          <p className="mt-3 leading-7 text-gray-300">{copy.company}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{copy.founderTitle}</h2>
          <p className="mt-3 leading-7 text-gray-300">{copy.founder}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">{copy.researchTitle}</h2>
          <p className="mt-3 leading-7 text-gray-300">{copy.research}</p>
        </section>

        <Link href={`/technical-paper/${locale || "en"}`} className="inline-flex text-primary hover:underline">
          {copy.papers}
        </Link>
      </article>
    </main>
  );
}
