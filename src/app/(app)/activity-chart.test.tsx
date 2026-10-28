import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { WeekActivity } from "@/lib/dashboard";

import { ActivityChart } from "./activity-chart";

const week = (day: number, created: number, sent: number): WeekActivity => ({ start: new Date(2026, 8, day), created, sent });
const weeks = [week(7, 2, 0), week(14, 1, 2), week(21, 3, 1), week(28, 1, 0)];

describe("the weekly activity chart (E9-8)", () => {
  it("sums up the period in words, with a legend for both series", () => {
    render(<ActivityChart weeks={weeks} />);
    const chart = screen.getByRole("region", { name: "Week by week" });
    expect(within(chart).getByText("You started 7 applications and sent 3 in this period.")).toBeInTheDocument();
    expect(within(chart).getByRole("list", { name: "Legend" })).toHaveTextContent("StartedSent");
  });

  it("has the numbers as a table, week by week", async () => {
    const user = userEvent.setup();
    render(<ActivityChart weeks={weeks} />);
    await user.click(screen.getByText("Show the numbers"));
    const table = screen.getByRole("table", { name: "Applications started and sent per week" });
    const rows = within(table).getAllByRole("row").map((row) => row.textContent);
    expect(rows).toEqual(["Week ofStartedSent", "7 Sep20", "14 Sep12", "21 Sep31", "28 Sep10"]);
  });

  it("draws each week's bars to scale and names the week on hover", () => {
    const { container } = render(<ActivityChart weeks={weeks} />);
    const columns = container.querySelectorAll("[aria-hidden='true'] .items-end > div");
    expect(columns).toHaveLength(4);
    const [started, sent] = columns[2].querySelectorAll("span");
    expect(started).toHaveStyle({ height: "100%" });
    expect(sent).toHaveStyle({ height: `${(1 / 3) * 100}%` });

    fireEvent.pointerEnter(columns[1]);
    expect(columns[1]).toHaveTextContent("Week of 14 Sep1 started · 2 sent");
    fireEvent.pointerLeave(columns[1]);
    expect(columns[1]).not.toHaveTextContent("Week of");
  });

  it("says so when there's nothing in the period", () => {
    render(<ActivityChart weeks={[]} />);
    expect(screen.getByText("Nothing to show yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Legend" })).not.toBeInTheDocument();
    expect(screen.queryByText("Show the numbers")).not.toBeInTheDocument();
  });
});
