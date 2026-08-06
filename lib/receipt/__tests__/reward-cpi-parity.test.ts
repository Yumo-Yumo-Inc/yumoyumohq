import { describe, expect, it } from "vitest";
import { getRewardCpiReferenceCountry } from "../reward-bonus";

describe("reward CPI country parity", () => {
  it("uses TR CPI as the reward reference for TH", () => {
    expect(getRewardCpiReferenceCountry("TH")).toBe("TR");
    expect(getRewardCpiReferenceCountry("th-TH")).toBe("TR");
  });

  it("keeps other countries on their own CPI source", () => {
    expect(getRewardCpiReferenceCountry("MY")).toBe("MY");
    expect(getRewardCpiReferenceCountry("TR")).toBe("TR");
  });
});
