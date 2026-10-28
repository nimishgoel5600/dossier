import { describe, expect, it } from "vitest";

import { fromMarkdown, plainText } from "./text";

describe("text from sources", () => {
  it("takes HTML out of a field, entities decoded, on one line", () => {
    expect(plainText("Senior <strong>Designer</strong> &amp;\n  Researcher")).toBe("Senior Designer & Researcher");
    expect(plainText(null)).toBe("");
  });

  it("reads light Markdown as plain text, keeping line breaks", () => {
    expect(fromMarkdown("**Who we are**\r\nA team.\n\n\n\n__Perks__\n- Lunch")).toBe("Who we are\nA team.\n\nPerks\n- Lunch");
    expect(fromMarkdown(undefined)).toBe("");
  });
});
