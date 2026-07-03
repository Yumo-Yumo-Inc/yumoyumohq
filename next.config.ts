import type { NextConfig } from "next"

// Latest upstream data still emits stale Baseline warnings during build as of April 2026.
// Suppress the known false-positive until the dependency publishes fresher metadata.
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA ??= "true"
process.env.BROWSERSLIST_IGNORE_OLD_DATA ??= "true"

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Speed Insights injects https://va.vercel-scripts.com/.../script.js (or .debug.js in dev).
      // 'unsafe-eval' intentionally omitted — the app does not need runtime eval
      // (smoke-test in a browser after CSP changes; revert this line if a needed
      // script relies on eval/new Function). 'unsafe-inline' stays for Next's
      // inline bootstrap.
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: wss:",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
]

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  async redirects() {
    return [
      { source: "/app/personal-insights", destination: "/app/patterns", permanent: true },
      { source: "/app/personal-insights/:path*", destination: "/app/patterns", permanent: true },
      { source: "/app/analysis", destination: "/app/patterns", permanent: true },
      { source: "/app/settings", destination: "/app/profile", permanent: true },
      { source: "/app/account", destination: "/app/profile", permanent: false },
      { source: "/app/account/:path*", destination: "/app/profile", permanent: false },
      { source: "/whitepaper", destination: "/vision", permanent: true },
      { source: "/whitepaper/:lang", destination: "/vision/:lang", permanent: true },
      {
        source: "/whitepaper/:lang/contribution-economy-and-token-design",
        destination: "/technical-paper/:lang/04-tokenomics-mechanics/08-supply-and-allocation",
        permanent: true,
      },
      { source: "/whitepaper/:lang/:slug*", destination: "/vision/:lang", permanent: true },
    ]
  },
  // framer-motion v12 ships ESM-only .mjs files that Turbopack's module-factory
  // can lose track of during HMR. Transpiling through Next.js pipeline fixes it.
  transpilePackages: ["framer-motion"],
  // Vercel deployment - output: 'standalone' kaldırıldı (Vercel otomatik halleder)
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // App pages must never be served from cache — Android kills the browser
        // tab when native camera opens (low memory), then restores from disk cache
        // which serves old JS bundles. no-store forces a fresh fetch on restore.
        source: "/app/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      {
        // Static assets have content hashes — safe to cache forever
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ]
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      // canvas modülünü Turbopack'te de devre dışı bırak
      canvas: { browser: "./lib/canvas-stub.js" },
    },
  },
  webpack: (config) => {
    // Sadece Turbopack kullanılmadığında (CI build, eski sürüm) devreye girer
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { message: /Invalid source mapURL|Could not parse source map/ },
    ]
    return config
  },
  // API route'ları için timeout ayarı (Google Vision/LLM için)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // proxy.ts buffers POST bodies; default 10MB can truncate receipt uploads (4.5MB file + multipart).
    proxyClientMaxBodySize: '15mb',
  },
}

export default nextConfig
