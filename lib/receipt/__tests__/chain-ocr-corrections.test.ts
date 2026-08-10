import { describe, expect, it } from "vitest";
import { correctKnownChainOcrTypos } from "@/lib/receipt/chain-ocr-corrections";

describe("correctKnownChainOcrTypos", () => {
  it("fixes ŞÜK MARKETLER → ŞOK MARKETLER", () => {
    expect(correctKnownChainOcrTypos("ŞÜK MARKETLER")).toBe("ŞOK MARKETLER");
    expect(correctKnownChainOcrTypos("ŞÜK MARKETLER TİC.A.Ş.")).toBe(
      "ŞOK MARKETLER TİC.A.Ş."
    );
  });

  it("fixes ASCII SUK MARKETLER → SOK MARKETLER", () => {
    expect(correctKnownChainOcrTypos("SUK MARKETLER T.A.S.")).toBe(
      "SOK MARKETLER T.A.S."
    );
  });

  it("leaves real merchants untouched", () => {
    expect(correctKnownChainOcrTypos("GÜZEL ENERJİ ŞÜKRÜPAŞA")).toBe(
      "GÜZEL ENERJİ ŞÜKRÜPAŞA"
    );
    expect(correctKnownChainOcrTypos("HAS KOKOREÇ ŞÜKRÜ AKIN")).toBe(
      "HAS KOKOREÇ ŞÜKRÜ AKIN"
    );
    expect(correctKnownChainOcrTypos("ŞOK MARKETLER")).toBe("ŞOK MARKETLER");
    expect(correctKnownChainOcrTypos("SOKAK LEZZETLERİ")).toBe("SOKAK LEZZETLERİ");
  });
});
