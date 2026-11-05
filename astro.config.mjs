import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages that live on vmeasure.ai today keep their old URLs as redirects.
const moved = JSON.parse(readFileSync(new URL('./src/data/generated/redirects.json', import.meta.url)));
const redirects = Object.fromEntries(
  Object.entries(moved).map(([slug, target]) => ['/' + slug.replaceAll('__', '/'), target]),
);

export default defineConfig({
  site: 'https://visailabs.com',
  trailingSlash: 'ignore',
  redirects: {
    ...redirects,
    '/job-openings': '/careers/',
    '/fullstack-developer': '/careers/',
    '/tag/blog': '/blog/',
    '/vmeasure': 'https://vmeasure.ai/',
  },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
