import { describe, expect, it } from "vitest";

import { HOLD_MS, heldPdf, holdPdf, pdfDownload } from "./downloads";

const pdf = new Uint8Array([37, 80, 68, 70]);

describe("held PDFs", () => {
  it("keeps a rendered PDF for its download, more than once, until it expires", () => {
    const now = Date.now();
    const id = holdPdf(pdf, "Jane – Resume.pdf", now);
    expect(heldPdf(id, now + 1_000)).toEqual({ pdf, fileName: "Jane – Resume.pdf" });
    expect(heldPdf(id, now + 2_000)).not.toBeNull();
    expect(heldPdf(id, now + HOLD_MS)).toBeNull();
  });

  it("drops the oldest when too many wait at once", () => {
    const now = Date.now();
    const ids = Array.from({ length: 21 }, (_, index) => holdPdf(pdf, `${index}.pdf`, now));
    expect(heldPdf(ids[0], now)).toBeNull();
    expect(heldPdf(ids[20], now)).toMatchObject({ fileName: "20.pdf" });
  });

  it("answers with the PDF as a named download", async () => {
    const response = pdfDownload(pdf, "Jane – Resume.pdf");
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''Jane%20%E2%80%93%20Resume.pdf");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdf);
  });
});
