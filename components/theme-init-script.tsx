/**
 * ThemeInitScript – Server Component
 * Renders a blocking inline script that applies the stored theme class
 * before React hydration, preventing the white flash on light-theme users.
 *
 * Kept in a separate file so the script string never appears inside a
 * JSX return value in layout.tsx (avoids TypeScript 5.9 brace-parsing issues).
 */
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

  return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
}
