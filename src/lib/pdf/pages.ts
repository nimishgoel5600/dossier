/**
 * How many pages a PDF has, from its page objects. Chromium writes each as
 * a plain "/Type /Page" dictionary, so no PDF library is needed.
 */
export function countPdfPages(pdf: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(pdf);
  return (text.match(/\/Type\s*\/Page(?![A-Za-z])/g) ?? []).length;
}
