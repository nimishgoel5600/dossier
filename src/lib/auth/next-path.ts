const BASE = "http://dossier.invalid";

/**
 * Where to go after signing in: `next` when it's a page of this app (other
 * than /login), otherwise the dashboard. Anything that could leave the site,
 * such as "//evil.example" or "https://evil.example", is ignored.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next?.startsWith("/")) return "/";
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return "/";
  }
  if (url.origin !== BASE) return "/";
  if (url.pathname === "/login" || url.pathname.startsWith("/login/")) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
