import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";
import { RemovableChip, ToggleChip } from "./chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ProgressSteps } from "./progress-steps";
import { SegmentedControl } from "./segmented-control";
import { Stepper } from "./stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Toggle } from "./toggle";

describe("Toggle", () => {
  it("is a switch that flips with a click on its label and with Space", async () => {
    const user = userEvent.setup();
    render(<Toggle label="Nightly backups" description="Keeps 14 days." />);
    const toggle = screen.getByRole("switch", { name: "Nightly backups" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toHaveAccessibleDescription("Keeps 14 days.");

    await user.click(screen.getByText("Nightly backups"));
    expect(toggle).toHaveAttribute("aria-checked", "true");

    toggle.focus();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });
});

describe("SegmentedControl", () => {
  it("moves and selects with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        aria-label="View"
        options={[
          { value: "board", label: "Board" },
          { value: "table", label: "Table" },
        ]}
        defaultValue="board"
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "View" })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("radio", { name: "Board" })).toHaveFocus();
    // Radix moves focus on a timer and selects the option it lands on while
    // the arrow key is still down, so hold the key as a real key press does.
    await user.keyboard("{ArrowRight>}");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Table" })).toHaveFocus());
    await user.keyboard("{/ArrowRight}");
    expect(screen.getByRole("radio", { name: "Table" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("table");
  });
});

describe("Tabs", () => {
  it("switches tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="resume">
        <TabsList aria-label="Document">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="letter">Cover letter</TabsTrigger>
        </TabsList>
        <TabsContent value="resume">The resume</TabsContent>
        <TabsContent value="letter">The letter</TabsContent>
      </Tabs>,
    );
    await user.tab();
    expect(screen.getByRole("tab", { name: "Resume" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Cover letter" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("The letter");
  });
});

describe("DropdownMenu", () => {
  it("opens from the keyboard, closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onArchive}>Archive</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });

    trigger.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Archive" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");
    expect(onArchive).toHaveBeenCalledOnce();
    expect(trigger).toHaveFocus();
  });

  it("closes on a click outside", async () => {
    // While the menu is open, Radix sets pointer-events: none on the page
    // behind it; the click still reaches the document, as in a browser.
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });
    render(
      <>
        <p>Outside</p>
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(screen.getByText("Outside"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

describe("chips", () => {
  it("toggle chips report their state with aria-pressed", () => {
    render(
      <ToggleChip selected check>
        Figma
      </ToggleChip>,
    );
    const chip = screen.getByRole("button", { name: "Figma" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip).toHaveTextContent("✓ Figma");
  });

  it("removable chips have a named remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <RemovableChip meta="2 roles" removeLabel="Remove Figma" onRemove={onRemove}>
        Figma
      </RemovableChip>,
    );
    await user.click(screen.getByRole("button", { name: "Remove Figma" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe("steps", () => {
  it("Stepper marks the current step and the finished ones", () => {
    render(<Stepper steps={["Paste", "Check", "Documents"]} current={1} />);
    const steps = screen.getAllByRole("listitem");
    expect(steps[0]).toHaveTextContent("Paste (done)");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[2]).not.toHaveAttribute("aria-current");
  });

  it("ProgressSteps announces the step in progress", () => {
    const { rerender } = render(<ProgressSteps steps={["Reading", "Comparing"]} current={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("Reading…");
    rerender(<ProgressSteps steps={["Reading", "Comparing"]} current={2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Done.");
  });
});
