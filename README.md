# VisAI Labs website

A redesign built with Astro, Tailwind CSS v4, React + Framer Motion (navbar and homepage hero) and Three.js. All wording and images come from visailabs.com.

    npm install
    npm run dev            # http://localhost:4321
    npm run build          # static site in dist/
    npm run check:tokens   # fails if a color, font or custom size is defined outside tokens.css

## Change the design in one place

Everything visual lives in **`src/styles/tokens.css`**: colors, fonts, type scale, spacing, corners, motion and the WebGL effects. Change a value and the whole site follows, including the favicon.

| To change | Edit |
| --- | --- |
| Main accent color | `--color-orange` (and `--color-ember` for small accent text) |
| Page background / text | `--color-white`, `--color-ink` |
| Fonts | the `@import` lines and `--font-display`, `--font-body` |
| All spacing at once | `--spacing` (the base of every `p-*`, `m-*`, `gap-*`) |
| Space between sections / page margins | `--spacing-section`, `--spacing-gutter` |
| Navbar height, mega-menu width | `--spacing-nav-top`, `--spacing-nav`, `--container-mega` |
| Navbar and homepage hero colors | `--color-night`, `--color-scan`, `--color-measure`, `--color-ok` |
| Homepage headline size and reveal timing | `--text-hero`, `--text-hero-wide`, `--duration-reveal`, `--stagger-reveal` |
| Text sizes | `--text-display`, `--text-heading`, `--text-body` and the rest |
| Rounded corners | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Machine-vision effect | `--vision-edge`, `--vision-lens`, `--vision-sweep-seconds`, `--vision-grain` |
| Hero film timing | `--film-hold-seconds`, `--film-fade-seconds`, `--film-push` |
| Life at VisAI mosaic | `--spacing-tile` |
| 3D scan detail | `--scan-points`, `--scan-points-phone`, `--color-point` |

Tinted and dark blocks are the `.theme-sand` and `.theme-dark` classes at the bottom of the same file.

## Change the content

- `src/data/site.ts`: navigation, footer, contact details
- `src/data/pages.ts`: every page, as a list of sections
- `src/pages/index.astro`: the homepage
- `src/data/generated/`: blog posts, jobs and gallery extracted from the live site

## Before going live

- Contact forms open the visitor's email app. To post them to a server instead, set `PUBLIC_FORM_ENDPOINT` in `.env`.
- `site` in `astro.config.mjs` sets the domain used for canonical URLs and the sitemap.

## Navbar, heroes and gallery

- `src/components/react/Navbar.tsx` and `MegaMenu.tsx`: the navbar, Products menu and phone menu. Links and wording are `navbar` in `src/data/site.ts`.
- `src/components/react/Hero.tsx`: the homepage hero. Wording is `homeHero` in `src/data/site.ts`.
- `src/components/WhoWeAre.astro`, `src/scripts/who.ts`, `src/styles/who.css`: the homepage Who we are section. Wording, photos and spec rows are in the component; pacing and frame shapes are in the script.
- `src/three/hero/`: the hero's 3D scene. `scene.ts` has the camera and look settings at the top, `timeline.ts` the timing, `shaders.ts` the laser and point cloud, `textures.ts` the painted surfaces. It lowers its own quality if a device cannot keep up.
- `src/data/scan.ts`: parcel sizes, order numbers and the capture chip text.
- `src/components/react/Scan3D.tsx`: loads the 3D scene and holds the page text placed over it.
- `src/components/react/ScanAnimation.tsx`: the SVG fallback. It plays on devices without WebGL, and its server-rendered markup is the still image for reduced motion, low-power devices and no JavaScript.
- `src/styles/nav-hero.css`: styles for all of the above. Values come from `tokens.css`.
- `src/components/Hero.astro` and `src/scripts/hero.ts`: the opening of every other page. Each page lists its photos as `shots` in `src/data/pages.ts`; the photos are in `public/media/hero/`. To use real video later, replace the film in `Hero.astro` with a muted, looping `<video>`.
- `src/scripts/viewer.ts`: the full-screen photo viewer on Life at VisAI.
- `src/lib/links.ts`: vmeasure.ai and vaudit.ai links open in a new tab; all other links stay in the same tab.

## WebGL effects (`src/three/`)

- `vision.ts`: real photos seen as a machine sees them, with a scan line and mouse lens.
- `scan.ts`: the LiDAR-style point cloud of a pallet.
- `contour.ts`: the moving contour field in the footer.

Visitors without WebGL see the plain photos. With reduced motion on, effects hold still.
