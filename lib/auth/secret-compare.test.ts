import { afterEach, describe, expect, it, vi } from "vitest";
import { checkBearerSecret } from "@/lib/auth/secret-compare";

const URL = "https://yumoyumo.com/api/cron/health";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkBearerSecret cron diagnostics", () => {
  it("accepts the configured bearer token without logging", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const req = new Request(URL, {
      headers: {
        authorization: "Bearer configured-secret",
        "user-agent": "vercel-cron/1.0",
      },
    });

    expect(checkBearerSecret(req, "configured-secret")).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("identifies a missing production secret without exposing request values", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const req = new Request(URL, {
      headers: {
        authorization: "Bearer supplied-value",
        "user-agent": "vercel-cron/1.0",
      },
    });

    expect(checkBearerSecret(req, undefined)).toBe(false);
    expect(error).toHaveBeenCalledOnce();
    const message = String(error.mock.calls[0]?.[0]);
    expect(message).toContain("reason=secret-not-configured");
    expect(message).toContain("source=vercel-cron");
    expect(message).not.toContain("supplied-value");
  });

  it("distinguishes a missing authorization header", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const req = new Request(URL, {
      headers: { "user-agent": "vercel-cron/1.0" },
    });

    expect(checkBearerSecret(req, "configured-secret")).toBe(false);
    expect(String(warn.mock.calls[0]?.[0])).toContain(
      "reason=authorization-header-missing"
    );
  });

  it("reports a mismatch without logging either secret", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const req = new Request(URL, {
      headers: { authorization: "Bearer supplied-value" },
    });

    expect(checkBearerSecret(req, "configured-secret")).toBe(false);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain("reason=authorization-header-mismatch");
    expect(message).not.toContain("supplied-value");
    expect(message).not.toContain("configured-secret");
  });
});
