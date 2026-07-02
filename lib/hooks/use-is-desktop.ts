"use client";

import { useState, useEffect } from "react";

const LG_BREAKPOINT_PX = 1024;
const MEDIA_QUERY = `(min-width: ${LG_BREAKPOINT_PX}px)`;

/**
 * Returns true when viewport is lg (1024px) or wider (desktop layout).
 * SSR-safe: returns false until mounted, then matches Tailwind lg breakpoint.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
