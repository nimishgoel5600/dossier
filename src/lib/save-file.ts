// Offers files as downloads.

/** The object URL of the file offered last. */
let offered: string | null = null;

/**
 * Offers `blob` as a download named `fileName`. Its object URL isn't revoked
 * on a timer: when the browser asks where to save (Chrome and Edge can), it
 * reads the file only once a place is picked, however long that takes, and
 * a revoked URL saves an empty file. The next download frees it instead, and
 * leaving the page frees it anyway.
 */
export function saveFile(blob: Blob, fileName: string): void {
  if (offered) URL.revokeObjectURL(offered);
  offered = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = offered;
  link.download = fileName;
  link.click();
}

/** Downloads the file at `href`, under the name the server gives it. */
export function downloadFrom(href: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = "";
  link.click();
}
