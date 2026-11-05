/**
 * The Content Security Policy, shared by the Docker image (HTTP header, see docker/sws.toml)
 * and every build (a <meta> tag, for hosts that can't set headers such as GitHub Pages).
 * A test keeps docker/sws.toml in sync.
 */
export const CSP_DIRECTIVES: readonly string[] = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
];

/** Directives that only work as an HTTP header; browsers ignore them in a <meta> tag. */
export const CSP_HEADER_ONLY: readonly string[] = ["frame-ancestors 'none'"];

/** The policy as sent in the HTTP header. */
export const CSP_HEADER = [...CSP_DIRECTIVES, ...CSP_HEADER_ONLY].join('; ');

/** The policy as written into index.html. */
export const CSP_META = CSP_DIRECTIVES.join('; ');
