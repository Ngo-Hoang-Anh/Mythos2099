import { describe, expect, it } from "vitest";
import { formatAvg, keywordFullLabel, keywordHelp } from "./armySummary";

describe("formatAvg", () => {
  it("keeps integers and rounds averages to one decimal", () => {
    expect(formatAvg(5)).toBe("5");
    expect(formatAvg(5.3)).toBe("5.3");
    expect(formatAvg(14 / 3)).toBe("4.7");
    expect(formatAvg(4.666666666666667)).toBe("4.7");
    expect(formatAvg(0)).toBe("0");
  });

  it("formats keyword labels and help from averaged values", () => {
    const k = { name: "firstStrike" as const, value: 14 / 3 };
    expect(keywordFullLabel(k)).toBe("First Strike 4.7");
    expect(keywordHelp(k).title).toBe("First Strike 4.7");
    expect(keywordHelp(k).body).toContain("+4.7 ATK");
    expect(keywordHelp(k).body).not.toContain("AP");
  });
});
