// The API reads the acting moderator from this cookie (packages/api/src/context.ts).
const MODERATOR_COOKIE = 'mq_moderator';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Makes the API act as `username` from the next request on, for one year. */
export function writeModeratorCookie(username: string) {
  // The plain username, not URL-encoded: the API compares the cookie value as it is.
  document.cookie = `${MODERATOR_COOKIE}=${username}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
