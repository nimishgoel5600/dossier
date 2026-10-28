import { beforeEach, describe, expect, it, vi } from "vitest";

import { cancel, retry } from "./actions";
import { cancelJob, retryJob } from "./runner";

vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({ persistent: false, issuedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) }),
}));
vi.mock("./runner", () => ({ retryJob: vi.fn(), cancelJob: vi.fn() }));

beforeEach(() => {
  vi.mocked(retryJob).mockReset();
  vi.mocked(cancelJob).mockReset();
});

describe("job actions (E6-7)", () => {
  it("retries a failed job", async () => {
    vi.mocked(retryJob).mockResolvedValue(true);
    expect(await retry({ id: "job-1" })).toEqual({ ok: true, data: null });
    expect(retryJob).toHaveBeenCalledWith("job-1");
  });

  it("says so when there's nothing to retry", async () => {
    vi.mocked(retryJob).mockResolvedValue(false);
    expect(await retry({ id: "job-1" })).toEqual({ ok: false, error: "This can't be retried: it's still running or already done." });
  });

  it("cancels a job", async () => {
    expect(await cancel({ id: "job-1" })).toEqual({ ok: true, data: null });
    expect(cancelJob).toHaveBeenCalledWith("job-1");
  });
});
