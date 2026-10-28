import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  toast,
  TOAST_DURATION_MS,
  TOAST_WITH_ACTION_DURATION_MS,
  Toaster,
  toastResult,
} from "./toast";

describe("toasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    // Let the last toast expire so the next test starts empty.
    act(() => vi.runAllTimers());
    vi.useRealTimers();
  });

  it("shows a toast in a polite live region and hides it after 3.2 s", () => {
    render(<Toaster />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();

    act(() => toast("Marked as sent. Fingers crossed!"));
    expect(region).toHaveTextContent("Marked as sent. Fingers crossed!");

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(region).toHaveTextContent("Marked as sent.");
    act(() => vi.advanceTimersByTime(1));
    expect(region).toBeEmptyDOMElement();
  });

  it("replaces the current toast and restarts the timer", () => {
    render(<Toaster />);
    const region = screen.getByRole("status");
    act(() => toast("First"));
    act(() => vi.advanceTimersByTime(3000));
    act(() => toast("Second"));
    expect(region).toHaveTextContent(/^Second$/);

    act(() => vi.advanceTimersByTime(3000));
    expect(region).toHaveTextContent("Second");
    act(() => vi.advanceTimersByTime(200));
    expect(region).toBeEmptyDOMElement();
  });

  it("shows an action's toast or its error", () => {
    render(<Toaster />);
    const region = screen.getByRole("status");

    act(() => void toastResult({ ok: true, data: null, toast: "Saved." }));
    expect(region).toHaveTextContent("Saved.");

    act(() => void toastResult({ ok: false, error: "That theme is in use." }));
    expect(region).toHaveTextContent("That theme is in use.");

    const quiet = { ok: true as const, data: 1 };
    let returned: unknown;
    act(() => {
      returned = toastResult(quiet);
    });
    expect(returned).toBe(quiet);
    expect(region).toHaveTextContent("That theme is in use.");
  });

  it("shows an action button that runs once and closes the toast", () => {
    const onUndo = vi.fn();
    render(<Toaster />);
    act(() => toast("Marked as sent.", { action: { label: "Undo", onClick: onUndo } }));

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("keeps a toast with an action up longer", () => {
    render(<Toaster />);
    act(() => toast("Marked as sent.", { action: { label: "Undo", onClick: () => {} } }));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(TOAST_WITH_ACTION_DURATION_MS - TOAST_DURATION_MS));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("pauses while hovered or focused, and never pauses the next toast", () => {
    render(<Toaster />);
    act(() => toast("Marked as sent.", { action: { label: "Undo", onClick: () => {} } }));
    const button = screen.getByRole("button", { name: "Undo" });

    fireEvent.focus(button);
    act(() => vi.advanceTimersByTime(TOAST_WITH_ACTION_DURATION_MS * 2));
    expect(button).toBeInTheDocument();

    // Replaced while still focused: the new toast times out normally.
    act(() => toast("Something else."));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
