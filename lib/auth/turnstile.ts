import { headers } from "next/headers";

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileToken(token: string | null | undefined): Promise<TurnstileVerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Captcha service is not configured" };
    }
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Captcha token is required" };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);
  if (ip) {
    formData.set("remoteip", ip);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      return { success: false, error: "Captcha verification failed" };
    }

    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!data.success) {
      console.warn("[turnstile] verify failed:", data["error-codes"] ?? []);
      return {
        success: false,
        error: "Captcha verification failed",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[turnstile] verify failed:", error);
    return { success: false, error: "Captcha verification failed" };
  }
}

