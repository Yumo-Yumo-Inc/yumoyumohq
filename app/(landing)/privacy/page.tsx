import {
  LEGAL_COMPANY_ADDRESS,
  LEGAL_COMPANY_EMAIL,
  LEGAL_COMPANY_NAME,
  LEGAL_COMPANY_PHONE,
} from "@/lib/legal/constants";

const privacyContent = {
  title: "Yumo Yumo Privacy Notice",
  lastUpdated: "Last Updated: April 20, 2026",
  englishOnlyNote: "This legal document is provided in English only.",
  intro:
    "This Privacy Notice explains which personal data Yumo Yumo collects, why we process it, who we share it with, and how anonymized or aggregated insight products may be created from eligible datasets.",
  controllerTitle: "Data Controller",
  controller:
    `${LEGAL_COMPANY_NAME} is the company responsible for Yumo Yumo. Registered mailing address: ${LEGAL_COMPANY_ADDRESS}. Phone: ${LEGAL_COMPANY_PHONE}. Email: ${LEGAL_COMPANY_EMAIL}.`,
  sections: [
    {
      title: "1. Data We Collect",
      content:
        "Depending on how you use the Services, we may collect your email address, username, password hash, country, birth date, receipt data, wallet address, support messages, session logs, IP address, device or browser information, captcha verification results, and email verification or password reset records.",
    },
    {
      title: "2. Why We Process Data",
      content:
        "We process personal data to create and secure your account, verify your email, reset your password, provide receipt and spending analysis, support rewards features, respond to support requests, prevent abuse and fraud, keep the platform secure, and comply with legal obligations.",
    },
    {
      title: "3. Anonymized and Aggregated Insight Products",
      content:
        "We may transform eligible datasets into anonymized or aggregated outputs by removing or reducing data points that directly identify a person. These outputs may be used to generate statistics, benchmarks, market insights, analytics, reports, and product intelligence. Where those outputs no longer identify a specific person, they may be shared, licensed, commercialized, or offered to partners or customers.",
    },
    {
      title: "4. Legal Basis",
      content:
        "Where applicable, we process personal data because it is necessary to perform our contract with you, to protect legitimate interests such as security and fraud prevention, to comply with legal obligations, or because you have given consent for optional processing. Not every processing activity depends on consent.",
    },
    {
      title: "5. Service Providers and Recipients",
      content:
        "We may use infrastructure, hosting, database, email, security, analytics, AI, fraud prevention, wallet, blockchain, and support vendors to operate the Services. Current or planned vendors may include Vercel, Neon, Vercel Blob, Cloudflare Turnstile, Resend, Google APIs including Gemini, Vision, Maps and Places, OpenAI, Axiom, Solana infrastructure, wallet providers, and similar service providers. We may also disclose data to regulators, courts, or public authorities where legally required.",
    },
    {
      title: "6. International Transfers",
      content:
        "Because some of our vendors or servers may operate internationally, your data may be processed in countries outside your own jurisdiction. Where required, we aim to use appropriate safeguards such as data processing agreements, standard contractual clauses, transfer impact assessments, access controls, encryption, and data minimization.",
    },
    {
      title: "7. Retention",
      content:
        "We keep personal data only for as long as needed for the purposes described in this Notice, for account security, for service continuity, or to meet legal, tax, audit, and dispute-resolution obligations. Receipt image files and the raw OCR/AI extraction output are designed to be deleted from storage after approximately 48 hours, while receipt metadata, reward ledgers, fraud records, consent logs, and account records may be retained longer where needed for product integrity, legal compliance, dispute handling, and abuse prevention.",
    },
    {
      title: "8. Your Rights",
      content:
        `Depending on where you live, you may have rights to request access to your data, ask for correction or deletion, object to certain processing, request restriction, ask for portability, withdraw consent for optional processing where consent was used, appeal or complain to a privacy authority, or opt out of sale, sharing, or targeted advertising where those rights apply. To make a request, email ${LEGAL_COMPANY_EMAIL}. We may need to verify your identity before fulfilling the request. In-app automated account deletion and export are not available in this first version; requests are handled through the email workflow.`,
    },
    {
      title: "9. Security",
      content:
        "We use reasonable technical and organizational measures to protect data, including access controls, hashed passwords, and operational security practices. No system can guarantee absolute security.",
    },
    {
      title: "10. Age Restriction",
      content:
        "The Services are intended for adults. You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account.",
    },
    {
      title: "11. Cookies and Similar Technologies",
      content:
        "We use strictly necessary cookies and similar local storage technologies for security, authentication, abuse prevention, language preferences, and core site functionality. Where optional cookies or similar technologies are used for functional preferences or analytics, we ask for your choice before enabling them. You may reject optional cookies and continue using the Services. You can reopen Cookie Preferences from the site footer or app settings. If your browser sends a Global Privacy Control signal, we treat it as a request to keep analytics and targeted tracking off where applicable.",
    },
    {
      title: "12. Sale, Sharing, and Targeted Advertising",
      content:
        "We do not sell personal information. We do not intentionally share personal information for cross-context behavioral advertising or targeted advertising in the current product setup. If this changes, we will update this Notice, provide the legally required opt-out controls, and honor applicable Global Privacy Control signals.",
    },
    {
      title: "13. Privacy Request Process",
      content:
        `Send privacy requests to ${LEGAL_COMPANY_EMAIL} from the email address attached to your account when possible. Include the request type, your username, and enough information for us to verify the account. We will record the request, verify identity, review legal exceptions, respond within the timeline required by applicable law, and explain if we cannot complete a request in full.`,
    },
    {
      title: "14. Updates",
      content:
        "We may update this Privacy Notice from time to time. Material updates may be announced through the website, app, or another appropriate digital channel.",
    },
    {
      title: "15. Contact",
      content:
        `For privacy or data protection questions, contact us at ${LEGAL_COMPANY_EMAIL}. You may also contact ${LEGAL_COMPANY_NAME} by phone at ${LEGAL_COMPANY_PHONE} or by mail at ${LEGAL_COMPANY_ADDRESS}.`,
    },
  ],
  tables: [
    {
      title: "Data categories and purposes",
      headers: ["Category", "Purpose / legal basis", "Typical recipients"],
      rows: [
        ["Account data", "Create accounts, authenticate users, provide service, security, legal compliance", "Hosting, database, email, security providers"],
        ["Receipt data and metadata", "Analyze receipts, generate insights, detect fraud, calculate rewards", "Hosting, blob storage, AI/OCR providers, database providers"],
        ["Wallet and reward data", "Support utility rewards, eligibility, blockchain-related features when enabled", "Wallet providers, blockchain infrastructure, analytics and fraud systems"],
        ["Support and request data", "Respond to support, privacy, legal, and security requests", "Email, support, hosting, database providers"],
        ["Cookie and device data", "Security, language, preferences, optional analytics where allowed", "Hosting, analytics, security providers"],
      ],
    },
    {
      title: "Retention schedule",
      headers: ["Data type", "Default retention approach", "Notes"],
      rows: [
        ["Receipt images", "Approximately 48 hours after upload", "May be kept longer only if required for abuse, legal, or dispute handling"],
        ["Raw OCR and AI extraction output", "Approximately 48 hours after upload, deleted together with the image", "Structured receipt records derived from it are retained per the row below"],
        ["Receipt metadata and analysis outputs", "For account life plus legal/audit needs", "Used for insights, reward records, fraud prevention, and account history"],
        ["Account and consent records", "For account life plus legal limitation periods", "Includes Terms, Privacy, cookie, and marketing consent records"],
        ["Security, fraud, and abuse logs", "As needed for platform integrity", "May be retained after account closure where legally permitted"],
        ["Waitlist and marketing records", "Until unsubscribe, deletion request, or business need ends", "Suppression records may be retained to honor unsubscribe requests"],
      ],
    },
    {
      title: "Subprocessors and transfers",
      headers: ["Vendor / category", "Role", "Transfer safeguard"],
      rows: [
        ["Vercel / Vercel Blob", "Hosting, deployment, blob storage", "Vendor DPA, technical safeguards, transfer safeguards where required"],
        ["Neon", "PostgreSQL database", "Vendor DPA, access controls, transfer safeguards where required"],
        ["Cloudflare Turnstile", "Captcha and abuse prevention", "Vendor terms/DPA, security purpose limitation"],
        ["Resend", "Transactional email", "Vendor DPA, email delivery controls"],
        ["Google APIs, Gemini, Vision, Maps, Places", "OCR, AI analysis, maps and place enrichment", "Vendor terms/DPA, data minimization, transfer safeguards where required"],
        ["OpenAI", "AI-assisted analysis where configured", "Vendor terms/DPA, data minimization, transfer safeguards where required"],
        ["Axiom", "Operational logging when enabled", "Vendor DPA, log minimization"],
        ["Wallet and Solana providers", "Wallet connection and blockchain infrastructure", "Public-chain constraints, user-controlled wallet interactions"],
      ],
    },
  ],
  closing:
    "This Notice should be read together with the Terms & Conditions and the disclosures shown during signup.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-10 lg:p-12 shadow-xl backdrop-blur-xl">
            <div className="mb-8">
              <h1 className="mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-3xl sm:text-4xl font-bold text-transparent md:text-5xl break-words">
                {privacyContent.title}
              </h1>
              <p className="mb-6 text-sm text-gray-300">{privacyContent.lastUpdated}</p>
              <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                {privacyContent.englishOnlyNote}
              </div>
              <div className="space-y-4 text-white leading-relaxed">
                <p className="text-lg text-gray-100">{privacyContent.intro}</p>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-gray-200">
                <p className="font-semibold text-white">{privacyContent.controllerTitle}</p>
                <p className="mt-2">{privacyContent.controller}</p>
              </div>
            </div>

            <div className="space-y-8">
              {privacyContent.sections.map((section, index) => (
                <section key={index} className="border-b border-white/10 pb-5 sm:pb-6 last:border-b-0">
                  <h2 className="mb-3 text-xl sm:text-2xl font-bold text-white md:text-3xl break-words">
                    {section.title}
                  </h2>
                  <p className="whitespace-pre-line leading-relaxed text-gray-200">
                    {section.content}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-8">
              {privacyContent.tables.map((table) => (
                <section key={table.title} className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <h2 className="px-4 py-4 text-lg sm:text-xl font-bold text-white md:px-5 break-words">
                    {table.title}
                  </h2>

                  {/* Desktop: full table (md and up) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-t border-white/10 text-left text-sm">
                      <thead className="bg-white/5 text-white">
                        <tr>
                          {table.headers.map((header) => (
                            <th key={header} className="px-4 py-3 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-gray-200">
                        {table.rows.map((row) => (
                          <tr key={row.join("|")}>
                            {row.map((cell) => (
                              <td key={cell} className="px-4 py-3 align-top leading-6">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: stacked cards so the data is actually readable on phones (privacy/KVKK content cannot live behind a sideways scroll) */}
                  <div className="md:hidden divide-y divide-white/10 border-t border-white/10">
                    {table.rows.map((row) => (
                      <div key={row.join("|")} className="p-4 space-y-3">
                        {row.map((cell, i) => (
                          <div key={`${table.title}-${table.headers[i]}-${i}`}>
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                              {table.headers[i]}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-gray-200 break-words">
                              {cell}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 md:mt-12 border-t border-white/10 pt-6 md:pt-8">
              <p className="text-base sm:text-lg leading-relaxed text-white">{privacyContent.closing}</p>
              <p className="mt-3 sm:mt-4 text-sm text-gray-300">{privacyContent.lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
