// The GGJ Host Programme lives on its own learning platform (ggj-learn).
// Locally that's the dev server on :3100; in production it will be
// learn.globalgoalsjam.org. Override with VITE_LEARN_URL if needed.
export const LEARN_URL =
  (import.meta.env.VITE_LEARN_URL as string | undefined) ||
  (import.meta.env.DEV ? 'http://localhost:3100' : 'https://learn.globalgoalsjam.org')
