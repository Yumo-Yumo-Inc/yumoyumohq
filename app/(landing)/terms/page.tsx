import {
  LEGAL_COMPANY_ADDRESS,
  LEGAL_COMPANY_EMAIL,
  LEGAL_COMPANY_NAME,
  LEGAL_COMPANY_PHONE,
} from "@/lib/legal/constants";

const termsContent = {
  title: "Terms & Conditions",
  lastUpdated: "Last Updated: April 20, 2026",
  englishOnlyNote: "This legal document is provided in English only.",
  intro: "Welcome to Yumo Yumo.",
  intro2:
    "These Terms & Conditions govern your access to and use of our website, apps, panels, subdomains, and related services. By creating an account or using the Services, you agree to these Terms.",
  companyDetailsTitle: "Company Information",
  companyDetails: `${LEGAL_COMPANY_NAME} operates Yumo Yumo. Registered mailing address: ${LEGAL_COMPANY_ADDRESS}. Phone: ${LEGAL_COMPANY_PHONE}. Email: ${LEGAL_COMPANY_EMAIL}.`,
  sections: [
    {
      title: "1. Eligibility",
      content:
        "You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create and use a Yumo Yumo account.",
    },
    {
      title: "2. Account Responsibility",
      content:
        "You are responsible for the accuracy of the information you provide during signup, the confidentiality of your password and account credentials, and the activities that occur under your account.",
    },
    {
      title: "3. Scope of the Services",
      content:
        "The Services may include account creation, email verification, password reset, profile management, receipt upload, spending analysis, hidden-cost insights, rewards features, and related digital tools. We may update, expand, limit, or discontinue features at any time.",
    },
    {
      title: "4. User Content and Data-Derived Outputs",
      content:
        "You confirm that any receipts, submissions, and content you upload are lawfully shared and do not violate the rights of others. You understand that eligible datasets may be transformed into anonymized or aggregated outputs used for analytics, benchmarking, reporting, product intelligence, and related commercial uses where those outputs no longer identify a specific person.",
    },
    {
      title: "5. Rewards and Token-Related Features",
      content:
        "Any rewards, contribution points, experience points, token-like units, estimates, or utility features available in the Services are non-transferable in-app utility records unless and until we expressly enable another use. They are subject to product rules, eligibility requirements, fraud checks, sanctions controls, technical constraints, and legal review that may change over time. They do not guarantee any token claim, airdrop, transfer, cash value, exchange listing, profit, or future benefit. Nothing in the Services constitutes financial, investment, tax, or legal advice. Any tax consequences remain your responsibility.",
    },
    {
      title: "6. Prohibited Use",
      content:
        "You may not create accounts with false information, upload fake or unauthorized materials, submit another person's receipts without authorization, misuse automation or bots, attempt to bypass security, manipulate rewards logic, evade geographic or sanctions restrictions, engage in unlawful conduct, or interfere with the integrity of the platform.",
    },
    {
      title: "7. Intellectual Property",
      content:
        "The platform design, software, code, trademarks, content, and service logic are owned by Yumo Yumo or its licensors. Your right to use the Services is limited, personal, non-exclusive, revocable, and non-transferable.",
    },
    {
      title: "8. Privacy and Disclosures",
      content:
        "Your use of the Services is also governed by our Privacy Notice / KVKK disclosure. The signup disclosures and acceptance records form part of the account creation flow.",
    },
    {
      title: "9. Third-Party Services",
      content:
        "We may rely on third-party providers for infrastructure, hosting, email, security, analytics, wallets, blockchains, and related technical services. We are not responsible for outages, policy changes, or technical limits imposed by those third parties.",
    },
    {
      title: "10. Disclaimers",
      content:
        "Hidden-cost estimates, benchmarks, and insight outputs are informational only. They do not constitute professional advice. The Services are provided on an \"as is\" and \"as available\" basis to the fullest extent permitted by law.",
    },
    {
      title: "11. Limitation of Liability",
      content:
        "To the fullest extent permitted by law, Yumo Yumo is not liable for indirect, incidental, special, consequential, or punitive damages, loss of profits, or loss of data arising from your use of the Services.",
    },
    {
      title: "12. Suspension and Termination",
      content:
        "We may suspend, restrict, terminate, withhold rewards, reverse in-app points where technically possible, or mark an account ineligible where we detect contractual breaches, unlawful conduct, fraud, abuse, sanctions risk, security risk, duplicate or manipulated activity, or where required by law.",
    },
    {
      title: "13. Token and Rewards Gate",
      content:
        "Before any token claim, transfer, conversion, or blockchain distribution is enabled, we may require additional Token & Rewards Terms, eligibility checks, jurisdiction checks, sanctions screening, tax disclosures, wallet verification, or identity verification. Users who do not meet those requirements may be excluded from claim, transfer, or distribution features.",
    },
    {
      title: "14. Acceptable Use and Fraud Policy",
      content:
        "Yumo Yumo is built around truthful contribution. Receipt tampering, duplicate submissions, scripted uploads, referral abuse, collusion, synthetic accounts, forged identities, and attempts to exploit pricing, reward, or quest rules are prohibited. We may use automated and manual review to protect the platform.",
    },
    {
      title: "15. Changes to the Terms",
      content:
        "We may revise these Terms from time to time. Material changes may be announced through the website, app, or another reasonable digital channel. Continued use of the Services after an update may constitute acceptance of the revised Terms.",
    },
    {
      title: "16. Governing Law",
      content:
        "These Terms are governed by the laws of the State of Delaware, United States, unless mandatory local law provides otherwise. Any disputes shall be resolved before the competent courts or forums available under applicable law.",
    },
    {
      title: "17. Contact",
      content: `Questions about these Terms may be sent to ${LEGAL_COMPANY_EMAIL}. You may also contact ${LEGAL_COMPANY_NAME} by phone at ${LEGAL_COMPANY_PHONE} or by mail at ${LEGAL_COMPANY_ADDRESS}.`,
    },
  ],
  closing:
    "If you do not agree to these Terms, you should not create an account or use the Services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-10 lg:p-12 shadow-xl backdrop-blur-xl">
            <div className="mb-8">
              <h1 className="mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-3xl sm:text-4xl font-bold text-transparent md:text-5xl break-words">
                {termsContent.title}
              </h1>
              <p className="mb-6 text-sm text-gray-300">{termsContent.lastUpdated}</p>
              <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100">
                {termsContent.englishOnlyNote}
              </div>
              <div className="space-y-3 text-white leading-relaxed">
                <p className="text-lg text-gray-100">{termsContent.intro}</p>
                <p className="text-gray-200">{termsContent.intro2}</p>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-gray-200">
                <p className="font-semibold text-white">{termsContent.companyDetailsTitle}</p>
                <p className="mt-2">{termsContent.companyDetails}</p>
              </div>
            </div>

            <div className="space-y-8">
              {termsContent.sections.map((section, index) => (
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

            <div className="mt-8 sm:mt-10 md:mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-10 backdrop-blur-xl">
              <div className="text-center">
                <p className="text-base sm:text-lg font-medium leading-relaxed text-white md:text-xl">
                  {termsContent.closing}
                </p>
                <p className="mt-4 sm:mt-6 text-sm text-gray-300">{termsContent.lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
