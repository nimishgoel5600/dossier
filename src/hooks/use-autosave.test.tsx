import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { savedLabel, SavedIndicator } from "@/components/saved-indicator";
import { toast } from "@/components/toast";

import { useAutosave } from "./use-autosave";

vi.mock("@/components/toast", () => ({ toast: vi.fn() }));

/** A save whose calls resolve or reject when the test says so. */
function controlledSave() {
  const calls: { value: string; resolve: (result?: unknown) => void; reject: () => void }[] = [];
  const save = vi.fn(
    (value: string) =>
      new Promise((resolve, reject) => {
        calls.push({ value, resolve, reject: () => reject(new Error("offline")) });
      }),
  );
  return { save, calls };
}

function setup(save: (value: string) => Promise<unknown>) {
  return renderHook(({ value }) => useAutosave(value, save, 500), {
    initialProps: { value: "Jane" },
  });
}

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(toast).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("doesn't save the value the form started with", () => {
    const { save } = controlledSave();
    const { result } = setup(save);
    act(() => vi.advanceTimersByTime(1000));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("saves once typing pauses for 500 ms, with the latest value", async () => {
    const { save, calls } = controlledSave();
    const { result, rerender } = setup(save);

    rerender({ value: "Jane H" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: "Jane Doe" });
    expect(result.current.status).toBe("saving");
    act(() => vi.advanceTimersByTime(499));
    expect(save).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(save).toHaveBeenCalledExactlyOnceWith("Jane Doe");

    await act(async () => calls[0].resolve());
    expect(result.current.status).toBe("saved");
    expect(result.current.savedAt).toBeInstanceOf(Date);
  });

  it("sends changes made during a save after it, so the last change wins", async () => {
    const { save, calls } = controlledSave();
    const { result, rerender } = setup(save);

    rerender({ value: "A" });
    act(() => vi.advanceTimersByTime(500));
    expect(save).toHaveBeenCalledTimes(1);

    // Two more changes while "A" is still being saved, and their debounce passes.
    rerender({ value: "AB" });
    rerender({ value: "ABC" });
    act(() => vi.advanceTimersByTime(500));
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => calls[0].resolve());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("ABC");
    expect(result.current.status).toBe("saving");

    await act(async () => calls[1].resolve());
    expect(result.current.status).toBe("saved");
  });

  it("saves right away on flush, e.g. on blur", () => {
    const { save } = controlledSave();
    const { result, rerender } = setup(save);
    rerender({ value: "Jane Doe" });
    act(() => result.current.flush());
    expect(save).toHaveBeenCalledExactlyOnceWith("Jane Doe");
    act(() => vi.advanceTimersByTime(1000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves pending changes when the page is hidden and when the form unmounts", () => {
    const { save } = controlledSave();
    const { rerender, unmount } = setup(save);

    rerender({ value: "hidden" });
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    act(() => void document.dispatchEvent(new Event("visibilitychange")));
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    expect(save).toHaveBeenLastCalledWith("hidden");

    rerender({ value: "navigated away" });
    unmount();
    // The first save is still running; the unmount flush is sent after it.
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves on unmount when nothing else is running", () => {
    const { save } = controlledSave();
    const { rerender, unmount } = setup(save);
    rerender({ value: "navigated away" });
    unmount();
    expect(save).toHaveBeenCalledExactlyOnceWith("navigated away");
  });

  it("retries a failed save once", async () => {
    const { save, calls } = controlledSave();
    const { result, rerender } = setup(save);
    rerender({ value: "Jane Doe" });
    act(() => vi.advanceTimersByTime(500));

    await act(async () => calls[0].reject());
    expect(save).toHaveBeenCalledTimes(2);
    await act(async () => calls[1].resolve());
    expect(result.current.status).toBe("saved");
    expect(toast).not.toHaveBeenCalled();
  });

  it("shows an error toast after the retry fails, and tries again on the next flush", async () => {
    const { save, calls } = controlledSave();
    const { result, rerender } = setup(save);
    rerender({ value: "Jane Doe" });
    act(() => vi.advanceTimersByTime(500));

    await act(async () => calls[0].reject());
    await act(async () => calls[1].reject());
    expect(result.current.status).toBe("error");
    expect(toast).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/^Couldn't save your changes\./));

    act(() => result.current.flush());
    expect(save).toHaveBeenCalledTimes(3);
    expect(save).toHaveBeenLastCalledWith("Jane Doe");
  });

  it("treats a failed action result as a failure and shows its error", async () => {
    const save = vi.fn(async () => ({ ok: false, error: "Enter a valid email." }));
    const { result, rerender } = setup(save);
    rerender({ value: "jane@" });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("error");
    expect(toast).toHaveBeenCalledWith("Enter a valid email.");
  });
});

describe("SavedIndicator", () => {
  it("says when changes were saved", () => {
    const savedAt = new Date("2026-09-27T14:05:00");
    expect(savedLabel(savedAt, new Date("2026-09-27T14:05:40"))).toBe("Saved just now");
    expect(savedLabel(savedAt, new Date("2026-09-27T14:07:10"))).toBe("Saved 2 min ago");
    expect(savedLabel(savedAt, new Date("2026-09-27T15:30:00"))).toMatch(/^Saved at /);
  });

  it("announces saves and errors, but not every 'Saving…'", () => {
    const { rerender } = render(<SavedIndicator status="saving" savedAt={null} />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();

    rerender(<SavedIndicator status="saved" savedAt={new Date()} />);
    expect(screen.getByText("Saved just now")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("All changes saved.");

    rerender(<SavedIndicator status="error" savedAt={new Date()} />);
    expect(screen.getByText("Couldn't save")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't save your changes.");
  });
});
