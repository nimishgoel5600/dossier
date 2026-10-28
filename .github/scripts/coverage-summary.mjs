// Prints the coverage totals as a Markdown table for the CI job summary (E11-1).
import { existsSync, readFileSync } from "node:fs";

const file = "coverage/coverage-summary.json";
if (!existsSync(file)) {
  console.log("No coverage report: the tests didn't finish.");
  process.exit(0);
}
const summary = JSON.parse(readFileSync(file, "utf8"));
const groups = { "All of src": () => true, "src/lib": (path) => path.includes("/src/lib/"), "src/lib/ai": (path) => path.includes("/src/lib/ai/") };
const metrics = ["lines", "statements", "functions", "branches"];

console.log("### Coverage\n");
console.log(`| | ${metrics.join(" | ")} |`);
console.log(`|---|${metrics.map(() => "---:").join("|")}|`);
for (const [name, matches] of Object.entries(groups)) {
  const totals = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  for (const [path, entry] of Object.entries(summary)) {
    if (path === "total" || !matches(path)) continue;
    for (const metric of metrics) {
      totals[metric].covered += entry[metric].covered;
      totals[metric].total += entry[metric].total;
    }
  }
  const cells = metrics.map((metric) => (totals[metric].total ? `${((100 * totals[metric].covered) / totals[metric].total).toFixed(1)}%` : "—"));
  console.log(`| ${name} | ${cells.join(" | ")} |`);
}
