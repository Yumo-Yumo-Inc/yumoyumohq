import { describe, it, expect } from "vitest";

import {
  webhookSecretMatches,
  toTelegramUser,
  largestPhotoFileId,
  parseCommand,
  extractImageFileId,
} from "../webhook-utils";

describe("webhookSecretMatches", () => {
  it("accepts an exact match", () => {
    expect(webhookSecretMatches("s3cret", "s3cret")).toBe(true);
  });
  it("rejects a wrong or empty token", () => {
    expect(webhookSecretMatches("wrong", "s3cret")).toBe(false);
    expect(webhookSecretMatches("", "s3cret")).toBe(false);
    expect(webhookSecretMatches(null, "s3cret")).toBe(false);
  });
  it("fails closed when no secret is configured", () => {
    expect(webhookSecretMatches("anything", "")).toBe(false);
    expect(webhookSecretMatches("anything", undefined)).toBe(false);
  });
  it("rejects a length mismatch without throwing", () => {
    expect(webhookSecretMatches("short", "a-much-longer-secret")).toBe(false);
  });
});

describe("toTelegramUser", () => {
  it("builds a user with a string id from a numeric id", () => {
    const u = toTelegramUser({ id: 7814459987, first_name: "Ugur", language_code: "tr" });
    expect(u?.id).toBe("7814459987");
    expect(typeof u?.id).toBe("string");
    expect(u?.languageCode).toBe("tr");
  });
  it("returns null for missing/invalid from", () => {
    expect(toTelegramUser(null)).toBeNull();
    expect(toTelegramUser({})).toBeNull();
    expect(toTelegramUser({ id: "not-a-number" })).toBeNull();
  });
});

describe("largestPhotoFileId", () => {
  it("picks the last (highest-res) size", () => {
    expect(largestPhotoFileId([{ file_id: "small" }, { file_id: "big" }])).toBe("big");
  });
  it("returns null for empty/absent", () => {
    expect(largestPhotoFileId([])).toBeNull();
    expect(largestPhotoFileId(undefined)).toBeNull();
  });
});

describe("parseCommand", () => {
  it("parses a command and strips @botname + args", () => {
    expect(parseCommand("/start")).toBe("start");
    expect(parseCommand("/limit@yumoyumbie_bot")).toBe("limit");
    expect(parseCommand("/help me")).toBe("help");
  });
  it("returns null for non-commands", () => {
    expect(parseCommand("hello")).toBeNull();
    expect(parseCommand(null)).toBeNull();
  });
});

describe("extractImageFileId", () => {
  it("prefers a photo file id", () => {
    expect(extractImageFileId({ photo: [{ file_id: "a" }, { file_id: "b" }] })).toBe("b");
  });
  it("accepts an image/pdf document", () => {
    expect(extractImageFileId({ document: { file_id: "doc", mime_type: "image/jpeg" } })).toBe("doc");
    expect(extractImageFileId({ document: { file_id: "pdf", mime_type: "application/pdf" } })).toBe("pdf");
  });
  it("ignores non-image documents and empty messages", () => {
    expect(extractImageFileId({ document: { file_id: "x", mime_type: "text/plain" } })).toBeNull();
    expect(extractImageFileId({})).toBeNull();
  });
});
