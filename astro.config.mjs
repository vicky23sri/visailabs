import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// Pages that live on vmeasure.ai today keep their old URLs as redirects.
const moved = JSON.parse(readFileSync(new URL('./src/data/generated/redirects.json', import.meta.url)));
const redirects = Object.fromEntries(
  Object.entries(moved).map(([slug, target]) => ['/' + slug.replaceAll('__', '/'), target]),
);

export default defineConfig({
  site: 'https://visailabs.com',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false }, // it would sit on top of the hero's scroll cue
  redirects: {
    ...redirects,
    '/job-openings': '/careers/',
    '/fullstack-developer': '/careers/',
    '/tag/blog': '/blog/',
    '/vmeasure': 'https://vmeasure.ai/',
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Bundled up front, so the dev server never has to re-bundle while a page is open
    // (that is what causes "504 Outdated Optimize Dep").
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'framer-motion',
        'gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'lenis', 'three',
        'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/RenderPass.js',
        'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/UnrealBloomPass.js',
        'three/addons/environments/RoomEnvironment.js', 'three/addons/geometries/RoundedBoxGeometry.js',
      ],
    },
  },
});
