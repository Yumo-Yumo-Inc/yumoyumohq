import { extractTotalRobust, extractVATRobust, parseLooseNumber } from "../../extractors/robust-extraction";
import { getCountryConfig } from "../../country/registry";
import type { OCRLine } from "../types";

describe("TR OCR totals and VAT", () => {
  const trConfig = getCountryConfig("TR");

  it("parses dot-decimal values in TR context", () => {
    expect(parseLooseNumber("69.25", trConfig)).toBeCloseTo(69.25, 2);
    expect(parseLooseNumber("69,25", trConfig)).toBeCloseTo(69.25, 2);
    expect(parseLooseNumber("1.234", trConfig)).toBe(1234);
    expect(parseLooseNumber("*69,25", trConfig)).toBeCloseTo(69.25, 2);
  });

  it("extracts total and VAT from TR lines with tender noise", () => {
    const lines: OCRLine[] = [
      { text: "E-Arsiv Fatura", lineNo: 1 },
      { text: "BIM BIRLESIK MAGAZALA A. S.", lineNo: 2 },
      { text: "16.01.2026 17:39", lineNo: 3 },
      { text: "KASEMARGARIN250GSOLE %1.", lineNo: 4 },
      { text: "*22.50", lineNo: 5 },
      { text: "TOPLAH KDV", lineNo: 6 },
      { text: "3.67", lineNo: 7 },
      { text: "Odenecek KDV Dahil Tuta", lineNo: 8 },
      { text: "69.25", lineNo: 9 },
      { text: "Nakit", lineNo: 10 },
      { text: "100.00", lineNo: 11 },
      { text: "Para Üstü", lineNo: 12 },
      { text: "-30.75", lineNo: 13 },
    ];

    const total = extractTotalRobust(lines, trConfig);
    expect(total.value).toBeCloseTo(69.25, 2);

    const vat = extractVATRobust(lines, total.value, trConfig);
    expect(vat.value).toBeCloseTo(3.67, 2);
  });
});
