import { describe, expect, it } from "vitest";

import { hashPassword, isPasswordHash, parsePasswordHash, verifyPassword } from "./password-hash";

describe("password hashes", () => {
  it("are argon2id with OWASP's settings, a fresh salt and no '$'", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash).toMatch(/^argon2id:m=19456,t=2,p=1:[\w-]{22}:[\w-]{43}$/);
    expect(hash).not.toContain("$");
    expect(hash).not.toContain("correct");
    expect(await hashPassword("correct horse")).not.toBe(hash);
  });

  it("accept only the exact password", async () => {
    const hash = await hashPassword("correct horse");
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("correct horse ", hash)).toBe(false);
    expect(await verifyPassword("Correct horse", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("check with the settings in the hash, so stronger ones can come later", async () => {
    // Three passes instead of two, checked against the reference argon2 CLI:
    // printf 'correct horse' | argon2 saltsaltsaltsalt -id -t 3 -k 19456 -p 1 -l 32
    const hash = "argon2id:m=19456,t=3,p=1:c2FsdHNhbHRzYWx0c2FsdA:DXmfh4ZE-QA8rfPP3DLuw2fPoDBfmSiqaNOQAEZcOHI";
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("correct horse", hash.replace("t=3", "t=2"))).toBe(false);
  });

  it("tell a password from a hash", async () => {
    expect(isPasswordHash(await hashPassword("x"))).toBe(true);
    for (const value of [
      "correct horse",
      "",
      // The usual PHC form, which .env files mangle.
      "$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0c2FsdA$b1NUnY3W4fy0XN5ZUUo+RWE8ZYJKWIS0cWOBY/Dvqwo",
      "argon2i:m=19456,t=2,p=1:c2FsdHNhbHRzYWx0c2FsdA:b1NUnY3W4fy0XN5ZUUo-RWE8ZYJKWIS0cWOBY_Dvqwo",
      "argon2id:m=19456,t=2,p=1:c2FsdA:b1NUnY3W4fy0XN5ZUUo-RWE8ZYJKWIS0cWOBY_Dvqwo",
      "argon2id:m=19456,t=0,p=1:c2FsdHNhbHRzYWx0c2FsdA:b1NUnY3W4fy0XN5ZUUo-RWE8ZYJKWIS0cWOBY_Dvqwo",
      "argon2id:m=7,t=2,p=1:c2FsdHNhbHRzYWx0c2FsdA:b1NUnY3W4fy0XN5ZUUo-RWE8ZYJKWIS0cWOBY_Dvqwo",
      // Over 256 MiB per sign-in.
      "argon2id:m=4194304,t=2,p=1:c2FsdHNhbHRzYWx0c2FsdA:b1NUnY3W4fy0XN5ZUUo-RWE8ZYJKWIS0cWOBY_Dvqwo",
    ]) {
      expect(isPasswordHash(value), value).toBe(false);
    }
  });

  it("never match when the stored value isn't a hash", async () => {
    expect(await verifyPassword("correct horse", "correct horse")).toBe(false);
    expect(parsePasswordHash("correct horse")).toBeNull();
  });
});
