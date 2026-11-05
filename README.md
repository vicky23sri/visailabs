# VisAI Labs website

A redesign built with Astro, Tailwind CSS v4 and Three.js. All wording and images come from visailabs.com.

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
| Navbar height and width | `--spacing-nav`, `--container-navbar` |
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

- `src/components/Header.astro` and `src/scripts/nav.ts`: the navbar, its reshaping dropdown and the full-screen menu.

- `src/components/Hero.astro` and `src/scripts/hero.ts`: the opening of every page. Each page lists its photos as `shots` in `src/data/pages.ts`; the photos are in `public/media/hero/`. To use real video later, replace the film in `Hero.astro` with a muted, looping `<video>`.
- `src/scripts/viewer.ts`: the full-screen photo viewer on Life at VisAI.
- `src/lib/links.ts`: vmeasure.ai and vaudit.ai links open in a new tab; all other links stay in the same tab.

## WebGL effects (`src/three/`)

- `vision.ts`: real photos seen as a machine sees them, with a scan line and mouse lens.
- `flight.ts`: the homepage flight through photographs in 3D. Photo list is in `src/pages/index.astro`.
- `scan.ts`: the LiDAR-style point cloud of a pallet.
- `contour.ts`: the moving contour field in the footer.

Visitors without WebGL see the plain photos. With reduced motion on, effects hold still.
