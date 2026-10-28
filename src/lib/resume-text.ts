import "server-only";

// The text of a resume file for the profile import (E4-10, PRO-12): PDF,
// Word (.docx) or Markdown (plain text works too), read on the server so
// every AI provider can work with it, local models included (decided 29
// September 2026).

/** The largest file the import takes; resumes are rarely over 1 MB. */
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
/** Enough for a long resume; the rest isn't sent to the model. */
export const MAX_RESUME_CHARACTERS = 30_000;
/** Below this, a file has no real text: usually a scanned PDF. */
const MIN_CHARACTERS = 80;

export const RESUME_MESSAGES = {
  tooBig: "That file is over 5 MB. A resume is usually much smaller: export it again without images.",
  wrongType: "Choose a PDF, a Word (.docx) or a Markdown (.md) file.",
  unreadable: "That file couldn't be read. Try exporting it from the program you wrote it in, as PDF or .docx.",
  noText: "There's no text in this file to read, so it's probably a scan. Export your resume from the program you wrote it in instead.",
  tooShort: "There's hardly any text in that file. Choose the one with your whole resume.",
};

export type ResumeText = { ok: true; text: string } | { ok: false; error: string };

const startsWith = (bytes: Uint8Array, signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const ZIP = [0x50, 0x4b, 0x03, 0x04]; // PK: .docx is a zip

/** Reads a resume's text, or says in plain words why it can't. */
export async function resumeText(bytes: Uint8Array): Promise<ResumeText> {
  if (bytes.length > RESUME_MAX_BYTES) return { ok: false, error: RESUME_MESSAGES.tooBig };
  let raw: string;
  // Markdown and plain text have no signature: a file is text when it reads as such.
  const written = startsWith(bytes, PDF) || startsWith(bytes, ZIP) ? null : asText(bytes);
  try {
    if (startsWith(bytes, PDF)) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      raw = (await extractText(await getDocumentProxy(bytes), { mergePages: true })).text;
    } else if (startsWith(bytes, ZIP)) {
      const mammoth = await import("mammoth");
      raw = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
    } else if (written !== null) {
      raw = markdownText(written);
    } else {
      return { ok: false, error: RESUME_MESSAGES.wrongType };
    }
  } catch {
    return { ok: false, error: RESUME_MESSAGES.unreadable };
  }
  const text = tidy(raw);
  if (text.replace(/\s/g, "").length < MIN_CHARACTERS) {
    return { ok: false, error: written === null ? RESUME_MESSAGES.noText : RESUME_MESSAGES.tooShort };
  }
  return { ok: true, text: text.slice(0, MAX_RESUME_CHARACTERS) };
}

/**
 * A file's text when it's something a person wrote: UTF-8 (a byte order mark
 * is fine) without the control characters binary files are full of, and not
 * RTF, whose markup would bury the resume. Null otherwise.
 */
function asText(bytes: Uint8Array): string | null {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return /[\x00-\x08\x0E-\x1F\x7F]/.test(text) || text.startsWith("{\\rtf") ? null : text;
  } catch {
    return null;
  }
}

/**
 * Markdown as plain text, the way a PDF's text reads: headings, bullets and
 * table rows stay lines, links keep their address, and formatting marks go,
 * so a name in bold still matches the resume when the answer is checked.
 */
export function markdownText(markdown: string): string {
  return (
    markdown
      .replace(/\r\n?/g, "\n")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^ {0,3}(```|~~~).*$/gm, "")
      // Images, embedded ones included, say nothing a model can read.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g, (_, label: string, url: string) =>
        label === url || `mailto:${label}` === url ? label : `${label} (${url.replace(/^mailto:/, "")})`,
      )
      .replace(/<((?:https?:\/\/|mailto:)[^>\s]+|[^@\s<>]+@[^@\s<>]+)>/g, (_, target: string) => target.replace(/^mailto:/, ""))
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[a-z][^>]*>/gi, "")
      .replace(/^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/gm, "$1")
      // Setext underlines, horizontal rules and table separators.
      .replace(/^ {0,3}(?:=+|-+|(?:[-*_][ \t]*){3,})[ \t]*$/gm, "")
      .replace(/^[ \t]*\|?(?:[ \t]*:?-+:?[ \t]*\|)+[ \t]*:?-*:?[ \t]*\|?[ \t]*(?:\n|$)/gm, "")
      .replace(/^([ \t]*)>[ \t]?/gm, "$1")
      .replace(/^([ \t]*)[*+][ \t]+/gm, "$1- ")
      .replace(/(\*\*|__)(?=\S)([^\n]*?\S)\1/g, "$2")
      .replace(/(^|[^\w*])([*_])(?=\S)([^\n]*?\S)\2(?![\w*])/gm, "$1$3")
      .replace(/~~(?=\S)([^\n]*?\S)~~/g, "$1")
      .replace(/`+([^`\n]+?)`+/g, "$1")
      .replace(/\\([!-/:-@[-`{-~])/g, "$1")
  );
}

/** Spaces and blank lines as a person would expect them. */
function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
