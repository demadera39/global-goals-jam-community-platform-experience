/**
 * Honeypot spam trap — one shared check for every public form.
 *
 * Forms render <HoneypotField> (hidden, out of the tab order). Humans never
 * see it, so it always arrives empty; bots that fill every input give
 * themselves away. When it comes back filled we pretend the submit worked:
 * the bot sees success, moves on to the next target, and doesn't come back
 * to try a different route.
 *
 * Deliberately no captcha — these forms get little traffic, and a captcha
 * costs real people more than this spam costs us.
 */

/** The field name rendered in the DOM. Looks plausible to a bot. */
export const HONEYPOT_NAME = 'company_website'

/** True when the submission looks automated and should be silently dropped. */
export function isSpamSubmission(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}
