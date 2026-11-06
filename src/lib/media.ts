import manifest from '../data/generated/media.json';

export type Media = { src: string; w: number; h: number };
const table = manifest as Record<string, Media>;
const entries = Object.entries(table);

/** Finds a downloaded image by part of its original file name. */
export function media(name: string): Media {
  const low = name.toLowerCase();
  const hit = entries.find(([url, m]) => url.includes(name) || m.src.includes(low));
  if (!hit) throw new Error(`No media named "${name}"`);
  return hit[1];
}

/** Finds a downloaded image by its exact original URL. */
export const mediaByUrl = (url: string): Media | undefined =>
  table[url.startsWith('//') ? 'https:' + url : url];

export const youtubeId = (url: string) => /(?:v=|youtu\.be\/)([\w-]{11})/.exec(url)?.[1] ?? url;


/** A smaller copy of a gallery photo, for tiles and the photo wall. */
export const thumbOf = (m: Media) => m.src.replace('/media/', '/media/thumb/');
