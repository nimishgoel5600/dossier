/** User-facing messages shared by Server Actions, route handlers and the pages calling them. */
export const messages = {
  signedOut: "You've been signed out. Sign in again to continue.",
  invalidInput: "Some details aren't valid. Check the highlighted fields.",
  unexpected: "Something went wrong on the server. Please try again.",
  crossOrigin: "This request didn't come from Dossier's own pages, so it was blocked.",
  offline: "Couldn't reach Dossier. Check your connection and try again.",
} as const;
