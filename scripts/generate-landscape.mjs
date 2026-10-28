import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const data = JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
if (data.user !== 'jiassia' || !Number.isSafeInteger(data.total) || data.total < 0 ||
    !Array.isArray(data.weeks) || data.weeks.length < 2 || data.weeks.length > 54) {
  throw new Error('Invalid contribution calendar.');
}
for (const week of data.weeks) {
  if (!Array.isArray(week.days) || week.days.length < 1 || week.days.length > 7) throw new Error('Invalid week.');
  for (const day of week.days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isSafeInteger(day.count) || day.count < 0 ||
        !Number.isInteger(day.level) || day.level < 0 || day.level > 4) throw new Error('Invalid day.');
  }
}
const dates = data.weeks.flatMap(w => w.days.map(d => d.date));
const weekly = data.weeks.map(w => w.days.reduce((sum, d) => sum + d.count, 0));
const peak = Math.max(1, ...weekly);
const step = 1048 / (weekly.length - 1);
const coordinates = weekly.map((count, i) => [76 + i * step, 407 - Math.round(Math.sqrt(count / peak) * 143)]);
const path = coordinates.map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y}`).join(' ');
const colors = ['#e7eef2','#a9e8d3','#73d8ba','#3fba9e','#248c7c'];
const columns = coordinates.map(([x, y], i) => {
  const count = weekly[i];
  const h = 454 - y;
  const level = Math.min(4, Math.ceil(Math.sqrt(count / peak) * 4));
  const grooves = Array.from({length: Math.max(1, Math.floor((h - 12) / 12))}, (_,j) => `<path d="M${(x-5).toFixed(1)} ${y+12+j*12}h10" stroke="#ffffff" stroke-opacity=".35"/>`).join('');
  return `<g><title>Week of ${data.weeks[i].days[0].date}: ${count} contributions</title><rect x="${(x-8).toFixed(1)}" y="${y}" width="16" height="${h}" rx="4" fill="${colors[level]}"/>${grooves}</g>`;
}).join('\n');
const robot = `<path d="M-12-16h24v14h-24z" fill="#172b42"/><path d="M-9-13h18v7h-18z" fill="#c5f36b"/><path d="M-6-12h3v3h-3zm9 0h3v3H3z" fill="#172b42"/><path d="M-15-12h3v7h-3zm27 0h3v7h-3zM-8-2h5v3h-5zm11 0h5v3H3z" fill="#172b42"/><path d="M-1-22h2v6h-2z" fill="#172b42"/><circle cy="-23" r="3" fill="#7b6bf1"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="556" viewBox="0 0 1200 556" role="img" aria-labelledby="title desc">
<title id="title">jiassia's commit landscape</title>
<desc id="desc">A tiny rover travels over ${weekly.length} weeks of real GitHub contributions. ${data.total} contributions from ${dates[0]} to ${dates.at(-1)}. Each column is one week.</desc>
<defs>
 <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#dce5eb"/></pattern>
 <linearGradient id="sky" x2="1" y2="1"><stop stop-color="#fafcfe"/><stop offset="1" stop-color="#eff6f5"/></linearGradient>
 <linearGradient id="floor"><stop stop-color="#bdebd7"/><stop offset="1" stop-color="#e4edf8"/></linearGradient>
</defs>
<style>
 text{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}
 .mono{font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace}
 .parked{display:none}
 @media(prefers-reduced-motion:reduce){.moving{display:none}.parked{display:inline}}
</style>
<rect x="1" y="1" width="1198" height="554" rx="28" fill="url(#sky)" stroke="#e2e9ee"/>
<rect x="32" y="180" width="1136" height="294" fill="url(#grid)" opacity=".8"/>
<g fill="#172b42">
 <text x="68" y="57" class="mono" font-size="12" letter-spacing="2.2">PERSONAL WORKSPACE / 01</text>
 <text x="64" y="141" font-size="76" font-weight="750" letter-spacing="-4">jiassia<tspan fill="#7b6bf1">.</tspan></text>
 <text x="69" y="177" font-size="17" fill="#65798a">A few ideas. A little progress. Repeat.</text>
</g>
<g transform="translate(907 42)">
 <rect width="226" height="100" rx="16" fill="#ffffff" stroke="#e0e8ee"/>
 <text x="21" y="48" font-size="34" font-weight="700" fill="#172b42">${data.total}</text>
 <text x="21" y="75" class="mono" font-size="12" fill="#65798a">CONTRIBUTIONS / 12 MONTHS</text>
 <g transform="translate(184 36)" fill="none" stroke="#7b6bf1" stroke-width="2"><circle r="12"/><path d="M0-7v14m-7-7H7"/></g>
</g>
<g fill="none" stroke="#c7d3df" stroke-width="1.5">
 <path d="M78 226h48m-24-24v48"/><circle cx="102" cy="226" r="15"/>
 <path d="M1003 220h54m-27-27v54" stroke-dasharray="3 6"/>
 <path d="M1102 309l5 8 9 2-9 4-5 9-3-9-9-4 9-2z"/>
</g>
<text x="165" y="238" class="mono" font-size="11" fill="#8a99a7" letter-spacing="1.4">SMALL STEPS, REAL SIGNAL.</text>
<path d="M68 455H1133" stroke="#c8d9e2" stroke-width="2"/>
<rect x="68" y="465" width="1065" height="4" rx="2" fill="url(#floor)"/>
${columns}
<path d="${path}" fill="none" stroke="#5c91a4" stroke-opacity=".2" stroke-width="1" stroke-dasharray="3 5"/>
<g class="moving"><animateMotion dur="32s" repeatCount="indefinite" calcMode="paced" path="${path}"/>${robot}</g>
<g class="parked" transform="translate(${coordinates[0][0]} ${coordinates[0][1]})">${robot}</g>
<g transform="translate(1137 405)"><path d="M0-27V48" stroke="#172b42" stroke-width="2"/><path d="M1-27h19l-7 9 7 9H1z" fill="#7b6bf1"/></g>
<text x="69" y="508" class="mono" font-size="12" fill="#65798a">${dates[0]} <tspan fill="#9eafbd">→</tspan> ${dates.at(-1)}</text>
<g transform="translate(825 499)"><circle cx="0" cy="4" r="4" fill="#73d8ba"/><text x="14" y="8" class="mono" font-size="11" fill="#65798a">1 COLUMN = 1 WEEK · UPDATED DAILY</text></g>
</svg>\n`;
const outDir = fileURLToPath(new URL('../assets/', import.meta.url));
mkdirSync(outDir, {recursive:true});
writeFileSync(new URL('../assets/activity-landscape.svg', import.meta.url), svg);
console.log(`Generated landscape: ${data.total} contributions, ${weekly.length} weeks.`);
