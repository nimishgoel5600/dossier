// The Content-Security-Policy every page gets (E11-5), set by the proxy with
// a fresh nonce per request. Next.js reads the nonce from the request's copy
// of the header and puts it on its own scripts, so pages have to render per
// request (the root layout waits for the connection).

/** 128 random bits, base64. */
export function createNonce(): string {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

/**
 * Scripts only with this request's nonce ('strict-dynamic' lets them load the
 * rest); styles may be inline, since React renders style attributes, which a
 * nonce can't cover. Nothing loads from other hosts, and no other site may
 * frame Dossier. `upgrade-insecure-requests` only over HTTPS, so a server on
 * plain HTTP in a home network keeps working. Development needs eval for
 * React's error overlay.
 */
export function contentSecurityPolicy(nonce: string, { dev = false, https = false }: { dev?: boolean; https?: boolean } = {}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
