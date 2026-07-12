// The GGJ Host Programme lives on its own learning platform, live at
// https://learn.globalgoalsjam.org (set via VITE_LEARN_URL in production).
// Locally that's the dev server on :3100. If the env var is ever missing,
// course entry points fall back to the in-app enrol page rather than
// pointing at a dead domain.
export const LEARN_URL =
  (import.meta.env.VITE_LEARN_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3100' : '/course/enroll')
