import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Select } from "./select";
import { Textarea } from "./textarea";

describe("form controls", () => {
  it("label the control and describe it with the hint and error", () => {
    render(<Input label="Website" hint="Include https://." error="That isn't a web address." />);
    const input = screen.getByLabelText("Website");
    expect(input).toHaveAccessibleDescription("Include https://. That isn't a web address.");
    expect(input).toBeInvalid();
  });

  it("leave out ARIA attributes that have nothing to point at", () => {
    render(<Input label="Full name" />);
    const input = screen.getByLabelText("Full name");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("keep an id passed by the caller", () => {
    render(<Textarea id="posting" label="Job posting" hint="Paste all of it." />);
    const textarea = screen.getByLabelText("Job posting");
    expect(textarea).toHaveAttribute("id", "posting");
    expect(textarea).toHaveAccessibleDescription("Paste all of it.");
  });

  it("work for selects and checkboxes", () => {
    render(
      <>
        <Select label="Paper size" error="Pick a size.">
          <option>A4</option>
        </Select>
        <Checkbox label="Show my age on resumes" hint="Many advise leaving it out." />
      </>,
    );
    expect(screen.getByLabelText("Paper size")).toHaveAccessibleDescription("Pick a size.");
    expect(screen.getByRole("checkbox", { name: "Show my age on resumes" })).toHaveAccessibleDescription(
      "Many advise leaving it out.",
    );
  });
});
