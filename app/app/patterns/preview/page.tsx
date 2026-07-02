"use client";

/**
 * Superseded by the auth-free preview at /patterns-preview (this route sits
 * behind the /app auth gate, so it could not be screenshotted). Kept as a stub
 * only to avoid a dangling route. Safe to delete — see the redesign decision record.
 */
export default function PatternsPreviewStub() {
  return (
    <div style={{ padding: 24 }}>
      Use <a href="/patterns-preview">/patterns-preview</a> for the mock-data preview.
    </div>
  );
}
