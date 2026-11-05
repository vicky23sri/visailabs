import raw from '../data/generated/posts.json';
import external from '../data/generated/external-posts.json';
import { mediaByUrl, type Media } from './media';

export type Card = { title: string; date: string; href: string; image?: Media; categories: string[]; external?: boolean };

const SITE = /https?:\/\/(?:www\.)?visailabs\.com/;
const slugs = new Set(raw.map((p) => p.slug));

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Points images at local files and same-site links at the rebuilt pages. */
function localize(html: string) {
  return html
    .replace(/<img ([^>]*?)src="([^"]+)"([^>]*)>/g, (_, a, src, b) => {
      const m = mediaByUrl(src);
      return m ? `<img ${a}src="${m.src}"${b} width="${m.w}" height="${m.h}" loading="lazy" decoding="async">` : '';
    })
    .replace(/href="([^"]+)"/g, (all, href) => {
      if (!SITE.test(href) || /wp-content/.test(href)) return all;
      const path = href.replace(SITE, '').replace(/\/+$/, '').replace(/^\//, '');
      return slugs.has(path) ? `href="/${path}/"` : all;
    })
    .replace(/href="(https?:\/\/(?:www\.)?(?:vmeasure|vaudit)\.ai[^"]*)"/g, 'href="$1" target="_blank" rel="noopener"');
}

export const posts = raw.map((p) => ({
  ...p,
  html: localize(p.html),
  media: p.image ? mediaByUrl(p.image.src) : undefined,
  time: Date.parse(p.date),
}));

// Blog entries the original now hosts on vmeasure.ai: listed, and linked out.
const offsite: Card[] = external.map((p) => ({
  title: p.title, date: p.date, href: p.href, image: mediaByUrl(p.img),
  categories: ['Automated Dimensioning System'], external: true,
}));

export const cards: Card[] = [
  ...posts.map((p) => ({ title: p.title, date: p.date, href: `/${p.slug}/`, image: p.media, categories: p.categories })),
  ...offsite,
].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

export const categories = [...new Set(cards.flatMap((c) => c.categories))].map((name) => ({
  name,
  slug: slugify(name),
  count: cards.filter((c) => c.categories.includes(name)).length,
}));
