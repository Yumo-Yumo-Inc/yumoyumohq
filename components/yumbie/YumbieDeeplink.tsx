"use client";

/**
 * YumbieDeeplink — consumes the `?yumbie=` intent set by a Yumbie notification's
 * deeplink (see notifyDeeplink). On app open it opens the awareness sheet
 * (`yumbie=insight`) or starts the weekly tour (`yumbie=tour`) as soon as the
 * data bridge has prepared them, then strips the param so it doesn't re-fire.
 * Renders nothing. Mounted once in the Gate.
 */
import { useEffect } from "react";
import { useYumbieInsight } from "./useYumbieInsight";
import { useYumbieTour } from "./useYumbieTour";

export function YumbieDeeplink() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const intent = url.searchParams.get("yumbie");
    if (intent !== "insight" && intent !== "tour") return;

    // Strip the param immediately so a refresh / back doesn't replay it.
    url.searchParams.delete("yumbie");
    window.history.replaceState({}, "", url.toString());

    // The bridge prepares the insight/tour shortly after mount — poll briefly.
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (intent === "insight" && useYumbieInsight.getState().current) {
        useYumbieInsight.getState().show();
        window.clearInterval(timer);
      } else if (intent === "tour") {
        const pending = useYumbieTour.getState().pending;
        if (pending) {
          useYumbieTour.getState().start(pending);
          window.clearInterval(timer);
        }
      }
      if (tries > 20) window.clearInterval(timer); // give up after ~10s
    }, 500);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
