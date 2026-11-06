// Fails if any design value is defined outside src/styles/tokens.css.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const skip = [join('src', 'styles', 'tokens.css'), join('src', 'data')]; // src/data holds only wording
const rules = [
  ['hard-coded color', /#[0-9a-fA-F]{3,8}\b(?![\w-]*['"]?\s*[:}]?\s*\w*\()|\b(?:rgba?|hsla?|oklch)\(/],
  ['arbitrary Tailwind value', /\b(?:[a-z-]+)-\[[^\]]*(?:px|rem|em|#|vw|vh)[^\]]*\]/],
  ['font family', /font-family:(?!\s*var\()/],
];
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

let bad = 0;
for (const file of walk('src')) {
  if (skip.some((s) => file.includes(s)) || !/\.(astro|ts|tsx|css|mjs)$/.test(file)) continue;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (/href=|https?:|#[a-z-]+['"`]/.test(line)) return;
    for (const [name, re] of rules) {
      if (re.test(line)) {
        console.log(`${file}:${i + 1}  ${name}: ${line.trim().slice(0, 90)}`);
        bad++;
      }
    }
  });
}
console.log(bad ? `\n${bad} design value(s) outside tokens.css` : 'All design values come from tokens.css');
process.exit(bad ? 1 : 0);
