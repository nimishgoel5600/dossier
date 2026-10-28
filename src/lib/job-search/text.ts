import "server-only";

import { parse } from "node-html-parser";

/** Text from a source's field that may hold HTML ("<strong>Developer</strong> &amp; more"), on one line. */
export function plainText(value: string | null | undefined): string {
  if (!value) return "";
  return parse(value).text.replace(/\s+/g, " ").trim();
}

/** A description in light Markdown ("**Bold**", "- items") as plain text, line breaks kept. */
export function fromMarkdown(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
