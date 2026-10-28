import { describe, expect, it } from "vitest";

import { DOCUMENT_LANGUAGES, detectDirection, documentLanguage, hasRightToLeft } from "./document-language";

describe("documentLanguage", () => {
  it("knows every built-in language (SET-7)", () => {
    expect(DOCUMENT_LANGUAGES).toHaveLength(21);
    expect(documentLanguage("Persian", "")).toEqual({ lang: "fa", dir: "rtl" });
    expect(documentLanguage("arabic", "")).toEqual({ lang: "ar", dir: "rtl" });
    expect(documentLanguage("Chinese (Simplified)", "")).toEqual({ lang: "zh-Hans", dir: "ltr" });
    expect(documentLanguage(" Japanese ", "")).toEqual({ lang: "ja", dir: "ltr" });
  });

  it("writes common right-to-left languages added with “Other language…” right to left", () => {
    expect(documentLanguage("Hebrew", "")).toEqual({ lang: "he", dir: "rtl" });
    expect(documentLanguage("Urdu", "")).toEqual({ lang: "ur", dir: "rtl" });
  });

  it("reads the text when there's no language, or one it doesn't know", () => {
    expect(documentLanguage(null, "سارا احمدی، طراح ارشد محصول")).toEqual({ lang: undefined, dir: "rtl" });
    expect(documentLanguage("Klingon", "佐藤 花子、シニアデザイナー")).toEqual({ lang: "ja", dir: "ltr" });
    expect(documentLanguage(undefined, "김지현 디자이너")).toEqual({ lang: "ko", dir: "ltr" });
    expect(documentLanguage(undefined, "王晓明 资深产品设计师")).toEqual({ lang: "zh-Hans", dir: "ltr" });
    expect(documentLanguage(undefined, "अनन्या शर्मा")).toEqual({ lang: "hi", dir: "ltr" });
    expect(documentLanguage(undefined, "Ελένη Παπαδοπούλου")).toEqual({ lang: "el", dir: "ltr" });
  });

  it("goes by most of the text, not a stray name", () => {
    expect(documentLanguage(undefined, "Designer at 阿里巴巴 and Northwind Logistics")).toEqual({ lang: undefined, dir: "ltr" });
    expect(documentLanguage(undefined, "Jane Doe, designer in Rotterdam")).toEqual({ lang: undefined, dir: "ltr" });
  });
});

describe("text direction", () => {
  it("counts letters, ignoring digits and punctuation", () => {
    expect(detectDirection("ليلى حداد, 2021")).toBe("rtl");
    expect(detectDirection("Jane, ليلى")).toBe("ltr");
    expect(detectDirection("+1 555 010 0000")).toBe("ltr");
  });

  it("spots right-to-left letters", () => {
    expect(hasRightToLeft("تهران, ایران")).toBe(true);
    expect(hasRightToLeft("sample@example.com")).toBe(false);
  });
});
