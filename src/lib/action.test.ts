import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { action, ActionError, publicAction } from "./action";
import { getSession } from "./auth/session";
import { messages } from "./messages";

vi.mock("./auth/session", () => ({ getSession: vi.fn() }));

const session = { persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) };

const schema = z.object({ name: z.string().min(1, "Enter a name.") });

describe("action", () => {
  beforeEach(() => {
    vi.mocked(getSession).mockResolvedValue(session);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the handler's data with the validated input", async () => {
    const rename = action(schema, async ({ name }) => ({ name: name.toUpperCase() }));
    await expect(rename({ name: "ledger" })).resolves.toEqual({
      ok: true,
      data: { name: "LEDGER" },
    });
  });

  it("carries a toast message", async () => {
    const markSent = action(schema, async (_, { toast }) => {
      toast("Marked as sent. Fingers crossed!");
      return null;
    });
    await expect(markSent({ name: "x" })).resolves.toEqual({
      ok: true,
      data: null,
      toast: "Marked as sent. Fingers crossed!",
    });
  });

  it("refuses to run without a session", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const handler = vi.fn();
    await expect(action(schema, handler)({ name: "x" })).resolves.toEqual({
      ok: false,
      error: messages.signedOut,
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid input", async () => {
    const handler = vi.fn();
    await expect(action(schema, handler)({ name: "" })).resolves.toEqual({
      ok: false,
      error: messages.invalidInput,
      fieldErrors: { name: ["Enter a name."] },
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes on the message of an ActionError", async () => {
    const remove = action(schema, async () => {
      throw new ActionError("That theme is in use.");
    });
    await expect(remove({ name: "x" })).resolves.toEqual({
      ok: false,
      error: "That theme is in use.",
    });
  });

  it("logs unexpected errors without their details and returns a generic message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const save = action(schema, async () => {
      throw new Error("Invalid invocation:\n  data: { apiKey: 'sk-secret' }");
    });

    await expect(save({ name: "x" })).resolves.toEqual({
      ok: false,
      error: messages.unexpected,
    });
    expect(log).toHaveBeenCalledOnce();
    const logged = String(log.mock.calls[0][0]);
    expect(logged).toContain("Error: Invalid invocation:");
    expect(logged).not.toContain("sk-secret");
  });

  it("lets redirect() through", async () => {
    const create = action(schema, async () => redirect("/applications/1"));
    await expect(create({ name: "x" })).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
  });
});

describe("publicAction", () => {
  it("runs without a session but still validates its input", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const signIn = publicAction(schema, async ({ name }, { toast }) => {
      toast(`Welcome back, ${name}.`);
      return { name };
    });
    await expect(signIn({ name: "Jane" })).resolves.toEqual({
      ok: true,
      data: { name: "Jane" },
      toast: "Welcome back, Jane.",
    });
    await expect(signIn({ name: "" })).resolves.toMatchObject({ ok: false, error: messages.invalidInput });
    expect(getSession).not.toHaveBeenCalled();
  });
});
