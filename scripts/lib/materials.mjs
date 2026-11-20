import { mixPalette } from './palette.mjs';

const WIDTH = 960;
const HEIGHT = 300;
const PAD = 56;
const SEED_Y = 124;
const MIN_RADIUS = 5;
const MAX_RADIUS = 40;
const MAX_LANGUAGES = 7;
const CREAM = '#f1ece2';
const MUTED = '#8a8b93';
const LINE = '#2a2b31';
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function renderMaterials({ languages, tools, updated }) {
  const shares = toShares(languages);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title">
<title id="title">${escapeXml(getTitle(shares, tools))}</title>
${renderStyle()}
${renderDefs()}
${renderWall(updated)}
${shares.map((item, i) => renderSeed(item, i, shares)).join('\n')}
${renderTools(tools)}
</svg>
`;
}

function toShares(languages) {
  const total = languages.reduce((sum, language) => sum + language.bytes, 0) || 1;
  const fits = languages.length <= MAX_LANGUAGES;
  const shown = fits ? languages : languages.slice(0, MAX_LANGUAGES - 1);
  const rest = fits ? 0 : languages.slice(MAX_LANGUAGES - 1).reduce((sum, language) => sum + language.bytes, 0);
  const list = rest ? [...shown, { name: 'Other', bytes: rest }] : shown;
  return list.map(({ name, bytes }) => ({ name, share: bytes / total }));
}

function getTitle(shares, tools) {
  const languages = shares.map(({ name, share }) => `${name} ${formatPercent(share)}`).join(', ');
  return `Materials: share of code across public repositories: ${languages}. Also working with ${tools.join(', ')}.`;
}

function renderStyle() {
  return `<style>
.caps{font:500 11px ${MONO};letter-spacing:2.5px;fill:${MUTED}}
.name{font:500 11px ${MONO};letter-spacing:2px;fill:${MUTED}}
.percent{font:italic 400 18px ${SERIF};fill:${CREAM}}
.tools{font:italic 400 17px ${SERIF};fill:${CREAM}}
.seed{transform-box:fill-box;transform-origin:center;transform:scale(0);animation:sprout .9s cubic-bezier(.2,.8,.2,1) forwards}
.float{animation:float 7s ease-in-out infinite alternate}
.reveal{opacity:0;animation:fade .9s ease-out forwards}
.light{opacity:0;animation:fade 1.6s ease-out forwards}
@keyframes sprout{to{transform:scale(1)}}
@keyframes float{from{transform:translateY(-3px)}to{transform:translateY(3px)}}
@keyframes fade{to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.seed{transform:none}.reveal,.light{opacity:1}}
</style>`;
}

function renderDefs() {
  return `<defs>
<clipPath id="wall"><rect width="${WIDTH}" height="${HEIGHT}" rx="16"/></clipPath>
<linearGradient id="wall-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1d22"/><stop offset="1" stop-color="#0e0f12"/></linearGradient>
<radialGradient id="spot" gradientUnits="userSpaceOnUse" cx="${WIDTH / 2}" cy="-60" r="420" gradientTransform="translate(${WIDTH / 2} -60) scale(1.6 1) translate(${-WIDTH / 2} 60)">
<stop offset="0" stop-color="#fff4dc" stop-opacity=".14"/><stop offset=".6" stop-color="#fff4dc" stop-opacity=".04"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
}

function renderWall(updated) {
  return `<g clip-path="url(#wall)">
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wall-gradient)"/>
<rect class="light" width="${WIDTH}" height="${HEIGHT}" fill="url(#spot)"/>
</g>
<text class="caps" x="${PAD - 16}" y="44">SHARE OF CODE · PUBLIC REPOS</text>
<text class="caps" x="${WIDTH - PAD + 16}" y="44" text-anchor="end">UPDATED ${updated.toUpperCase()}</text>`;
}

function renderSeed({ name, share }, index, shares) {
  const slot = (WIDTH - 2 * PAD) / shares.length;
  const x = (PAD + slot * (index + 0.5)).toFixed(1);
  const intensity = Math.sqrt(share / shares[0].share);
  const radius = (MIN_RADIUS + intensity * (MAX_RADIUS - MIN_RADIUS)).toFixed(2);
  const delay = `style="animation-delay:${(0.3 + index * 0.12).toFixed(2)}s"`;
  return `<g class="float" style="animation-delay:-${index * 1.3}s"><circle class="seed" ${delay} cx="${x}" cy="${SEED_Y}" r="${radius}" fill="${mixPalette(intensity)}" filter="url(#glow)"/></g>
<g class="reveal" ${delay}><text class="name" x="${x}" y="196" text-anchor="middle">${escapeXml(name.toUpperCase())}</text>
<text class="percent" x="${x}" y="222" text-anchor="middle">${escapeXml(formatPercent(share))}</text></g>`;
}

function renderTools(tools) {
  return `<line x1="${PAD - 16}" y1="248" x2="${WIDTH - PAD + 16}" y2="248" stroke="${LINE}"/>
<g class="reveal" style="animation-delay:1.2s"><text class="caps" x="${PAD - 16}" y="278">ALSO WORKING WITH</text>
<text class="tools" x="${PAD + 170}" y="278">${escapeXml(tools.join(' · '))}</text></g>`;
}

function formatPercent(share) {
  return share < 0.01 ? '<1%' : `${Math.round(share * 100)}%`;
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
