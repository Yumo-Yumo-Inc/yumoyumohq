"use client";

import { useEffect } from "react";

/**
 * ThemeInitScript – Client Component
 * Renders a blocking inline script that applies the stored theme class
 * before React hydration, preventing the white flash on light-theme users.
 *
 * React 19.2 dev builds warn ("Encountered a script tag while rendering
 * React component") whenever a <script> element is created during a client
 * render, because client-created scripts never execute. The module-level
 * flag below renders the script only for SSR and the first hydration mount;
 * later client-side remounts render null — the theme class is already
 * applied and lives on documentElement, which remounts never replace.
 * Same pattern as the fix proposed in pacocoursey/next-themes#397.
 *
 * Kept in a separate file so the script string never appears inside a
 * JSX return value in layout.tsx (avoids TypeScript 5.9 brace-parsing issues).
 */
let hasHydratedOnce = false;

export function ThemeInitScript() {
  // NOTE: no template literals here – TS 5.9 misparses {} inside JSX strings.
  const js = [
    "try{",
    "var t=localStorage.getItem(",
    JSON.stringify("app-theme"),
    ");",
    "if(t===",
    JSON.stringify("light"),
    ")document.documentElement.classList.add(",
    JSON.stringify("app-theme-light"),
    ")",
    "}catch(_){}",
  ].join("");

  useEffect(() => {
    hasHydratedOnce = true;
  }, []);

  if (hasHydratedOnce) {
    return null;
  }

  return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
}
