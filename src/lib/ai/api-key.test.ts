import { describe, expect, it, vi } from "vitest";

import {
  API_KEY_UNREADABLE,
  ApiKeyUnreadable,
  apiKeyState,
  applyApiKeyChange,
  decryptApiKey,
  encryptApiKey,
} from "./api-key";

vi.mock("@/lib/env", () => ({ env: { DOSSIER_SECRET: "a".repeat(32) } }));

const KEY = "sk-ant-api03-example-key";

describe("API key encryption", () => {
  it("round-trips", () => {
    expect(decryptApiKey(encryptApiKey(KEY))).toBe(KEY);
  });

  it("uses a fresh IV every time and never stores the key in the clear", () => {
    const first = encryptApiKey(KEY);
    const second = encryptApiKey(KEY);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^v1\.[\w-]+\.[\w-]+$/);
    expect(first).not.toContain("example");
  });

  it("refuses a tampered value", () => {
    const [version, iv, data] = encryptApiKey(KEY).split(".");
    const bytes = Buffer.from(data, "base64url");
    bytes[0] ^= 1;
    expect(() => decryptApiKey([version, iv, bytes.toString("base64url")].join("."))).toThrow(ApiKeyUnreadable);
  });

  it("refuses a value encrypted with another secret", () => {
    const stored = encryptApiKey(KEY, "b".repeat(32));
    expect(() => decryptApiKey(stored)).toThrow(API_KEY_UNREADABLE);
  });

  it("refuses unknown versions and malformed values", () => {
    const [, iv, data] = encryptApiKey(KEY).split(".");
    for (const stored of [`v2.${iv}.${data}`, "garbage", "v1..", `v1.${iv}.${data}.extra`]) {
      expect(() => decryptApiKey(stored), stored).toThrow(ApiKeyUnreadable);
    }
  });

  it("never puts key material in its error", () => {
    try {
      decryptApiKey(encryptApiKey(KEY, "b".repeat(32)));
    } catch (error) {
      expect(String(error)).not.toContain(KEY);
      expect((error as Error).message).toBe("Your saved API key can't be read. Please enter it again.");
    }
  });
});

describe("apiKeyState", () => {
  it("tells whether a key is saved and readable, without revealing it", () => {
    expect(apiKeyState(null)).toBe("none");
    expect(apiKeyState(encryptApiKey(KEY))).toBe("set");
    expect(apiKeyState(encryptApiKey(KEY, "b".repeat(32)))).toBe("unreadable");
  });
});

describe("applyApiKeyChange", () => {
  const stored = encryptApiKey(KEY);

  it("keeps the saved key unless told otherwise", () => {
    expect(applyApiKeyChange(stored, { action: "keep" })).toBe(stored);
    expect(applyApiKeyChange(stored, { action: "set", value: "   " })).toBe(stored);
  });

  it("replaces it with a new, encrypted one", () => {
    const next = applyApiKeyChange(stored, { action: "set", value: " sk-new " });
    expect(next).not.toBe(stored);
    expect(decryptApiKey(next!)).toBe("sk-new");
  });

  it("removes it only when cleared", () => {
    expect(applyApiKeyChange(stored, { action: "clear" })).toBeNull();
  });
});
