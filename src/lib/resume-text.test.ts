import { describe, expect, it } from "vitest";

import { docxWith, pdfWith } from "@/test/resume-files";

import { markdownText, MAX_RESUME_CHARACTERS, RESUME_MAX_BYTES, RESUME_MESSAGES, resumeText } from "./resume-text";

const LINES = [
  "John Doe",
  "Senior Product Designer - Utrecht",
  "Experience",
  "Design Lead, Acme Payments, 2021 - present",
  "Led the redesign of the payout flow for 40,000 merchants",
];

describe("resumeText (E4-10)", () => {
  it("reads a PDF", async () => {
    const result = await resumeText(pdfWith(LINES));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toContain("John Doe");
      expect(result.text).toContain("Led the redesign of the payout flow");
    }
  });

  it("reads a Word document, one line per paragraph", async () => {
    const result = await resumeText(docxWith(LINES));
    expect(result).toEqual({ ok: true, text: LINES.join("\n\n") });
  });

  it("reads Markdown as plain text", async () => {
    const markdown = [
      "---",
      "# John Doe",
      "**Senior Product Designer** · Utrecht · [robin@example.com](mailto:robin@example.com) · <https://robin.design>",
      "<!-- last updated in May -->",
      "",
      "## Experience",
      "",
      "### Design Lead, *Acme Payments*, 2021 – present",
      "* Led the redesign of the payout flow for 40,000 merchants",
      "+ Wrote the `design-system` docs, see [the site](https://acme.example/ds \"Acme DS\")",
      "",
      "| Skill | Level |",
      "|-------|:-----:|",
      "| Figma | Expert |",
      "",
      "![Portrait](data:image/png;base64,iVBORw0KGgo=)",
      "Handle: john_doe_design, 100\\% remote",
    ].join("\n");
    expect(await resumeText(new TextEncoder().encode(markdown))).toEqual({
      ok: true,
      text: [
        "John Doe",
        "Senior Product Designer · Utrecht · robin@example.com · https://robin.design",
        "",
        "Experience",
        "",
        "Design Lead, Acme Payments, 2021 – present",
        "- Led the redesign of the payout flow for 40,000 merchants",
        "- Wrote the design-system docs, see the site (https://acme.example/ds)",
        "",
        "| Skill | Level |",
        "| Figma | Expert |",
        "",
        "Handle: john_doe_design, 100% remote",
      ].join("\n"),
    });
  });

  it("reads plain text as it is, with or without a byte order mark", async () => {
    const text = ["John Doe", "Senior Product Designer, Utrecht", "Design Lead at Acme Payments since 2021, leading the payout flow redesign"].join("\n");
    const bytes = new TextEncoder().encode(String.fromCharCode(0xfeff) + text);
    expect(await resumeText(bytes)).toEqual({ ok: true, text });
    expect(markdownText("2 * 3 * 4 and snake_case_name")).toBe("2 * 3 * 4 and snake_case_name");
  });

  it("refuses other files, broken ones, scans and very large ones", async () => {
    expect(await resumeText(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]))).toEqual({ ok: false, error: RESUME_MESSAGES.wrongType });
    expect(await resumeText(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toEqual({ ok: false, error: RESUME_MESSAGES.wrongType });
    expect(await resumeText(new TextEncoder().encode("{\\rtf1\\ansi John Doe, Senior Product Designer, a resume long enough to read if it weren't RTF"))).toEqual({
      ok: false,
      error: RESUME_MESSAGES.wrongType,
    });
    expect(await resumeText(new TextEncoder().encode("# John Doe"))).toEqual({ ok: false, error: RESUME_MESSAGES.tooShort });
    expect(await resumeText(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]))).toEqual({ ok: false, error: RESUME_MESSAGES.unreadable });
    expect(await resumeText(pdfWith(["Page 1"]))).toEqual({ ok: false, error: RESUME_MESSAGES.noText });
    expect(await resumeText(new Uint8Array(RESUME_MAX_BYTES + 1))).toEqual({ ok: false, error: RESUME_MESSAGES.tooBig });
  });

  it("sends at most the first 30,000 characters", async () => {
    const result = await resumeText(docxWith(Array.from({ length: 800 }, (_, index) => `Line ${index} ${"x".repeat(60)}`)));
    expect(result.ok && result.text.length).toBe(MAX_RESUME_CHARACTERS);
  });
});
