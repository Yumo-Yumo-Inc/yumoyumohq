"use client";

import { useEffect } from "react";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { COOKIE_CONSENT_CHANGE_EVENT, hasAnalyticsConsent } from "@/lib/legal/cookie-consent";

/**
 * Use the vanilla injector instead of <SpeedInsights /> from
 * `@vercel/speed-insights/next`. Some Webpack client bundles crash with
 * `Cannot read properties of undefined (reading 'call')` when that React
 * entry loads; injecting the script avoids the broken module path.
 *
 * Speed Insights is an analytics signal, so it is only injected once the
 * visitor has granted analytics consent (and never under Global Privacy
 * Control, which forces analytics consent off). If consent is granted later
 * in the same session, the consent-change event triggers a deferred inject.
 */
export function SpeedInsightsClient() {
  useEffect(() => {
    let active = true;
    let injected = false;

    const tryInject = () => {
      if (!active || injected || !hasAnalyticsConsent()) return;
      try {
        injectSpeedInsights();
        injected = true;
      } catch (e) {
        console.warn("[speed-insights] inject failed:", e);
      }
    };

    tryInject();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, tryInject);
    return () => {
      active = false;
      window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, tryInject);
    };
  }, []);

  return null;
}
