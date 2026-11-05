import { readFileSync } from 'node:fs';

// The favicon takes its colors from tokens.css too.
const css = readFileSync('src/styles/tokens.css', 'utf8');
const token = (name: string) => new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css)?.[1].trim();

export const GET = () =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${token('ink')}"/><circle cx="16" cy="16" r="6" fill="${token('orange')}"/></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
