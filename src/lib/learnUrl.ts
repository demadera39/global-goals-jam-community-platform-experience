// The GGJ Host Programme lives on its own learning platform (ggj-learn).
// Locally that's the dev server on :3100. In production, set VITE_LEARN_URL
// (https://learn.globalgoalsjam.org) AT THE DEPLOY WHERE LEARN GOES LIVE —
// until then every course entry point safely falls back to the existing
// in-app course, so pushing the main site never points at a dead domain.
export const LEARN_URL =
  (import.meta.env.VITE_LEARN_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3100' : '/course/train-the-trainer')
