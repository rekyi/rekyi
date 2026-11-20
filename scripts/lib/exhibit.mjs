import { PALETTE, PAPER, SEED_COLOR, mixPalette } from "./palette.mjs";

const WIDTH = 960;
const HEIGHT = 420;
const CENTER = { x: 290, y: 215 };
const RADIUS = 122;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const INK = "#1b1b1f";
const MUTED = "#8a8b93";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const MAX_LATEST_LENGTH = 34;

export function renderExhibit(data) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title">
<title id="title">${escapeXml(getTitle(data))}</title>
${renderStyle()}
${renderDefs()}
${renderWall(data)}
${renderBloom(data.days)}
${renderLabel(data)}
${renderLegend()}
</svg>
`;
}

function getTitle({ day, total, streak, repos, latest }) {
  return `Bloom, ${day} days: rekyi's GitHub contributions, one seed per day since July 2026. ${total} contributions in the last year, ${streak}-day streak, ${repos} public repositories. Latest: ${latest}.`;
}

function renderStyle() {
  return `<style>
.caps{font:500 11px ${MONO};letter-spacing:3px;fill:${MUTED}}
.artist{font:700 15px ${SANS};fill:${INK}}
.role{font:400 15px ${SANS};fill:#6b6c72}
.title{font:italic 400 24px ${SERIF};fill:${INK}}
.subtitle{font:400 24px ${SERIF};fill:${INK}}
.medium{font:400 12px ${SANS};fill:#5f6067}
.text{font:400 13.5px ${SERIF};fill:#2b2c31}
.meta{font:500 10px ${MONO};letter-spacing:.6px;fill:#6b6c72}
.light{opacity:0;animation:fade 1.8s ease-out forwards}
.reveal{opacity:0;animation:fade 1s ease-out .8s forwards}
.bloom{transform-origin:${CENTER.x}px ${CENTER.y}px;animation:spin 240s linear infinite}
.seed{transform-box:fill-box;transform-origin:center;transform:scale(0);animation:sprout .7s cubic-bezier(.2,.8,.2,1) forwards}
.ring{transform-box:fill-box;transform-origin:center;opacity:0;animation:ring 2.4s ease-out 2.6s infinite}
.pulse{animation:pulse 2.2s ease-in-out infinite}
@keyframes fade{to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes sprout{to{transform:scale(1)}}
@keyframes ring{from{transform:scale(.4);opacity:.9}to{transform:scale(2.6);opacity:0}}
@keyframes pulse{50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.light,.reveal{opacity:1}.seed{transform:none}.ring{opacity:.9}}
</style>`;
}

function renderSpotGradient(id, x) {
  return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${x}" cy="-40" r="300" gradientTransform="translate(${x} -40) scale(1 1.6) translate(${-x} 40)">
<stop offset="0" stop-color="#fff4dc" stop-opacity=".2"/><stop offset=".5" stop-color="#fff4dc" stop-opacity=".06"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient>`;
}

function renderDefs() {
  return `<defs>
<clipPath id="wall"><rect width="${WIDTH}" height="${HEIGHT}" rx="16"/></clipPath>
<linearGradient id="wall-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1d22"/><stop offset="1" stop-color="#0e0f12"/></linearGradient>
${renderSpotGradient("spot-art", CENTER.x)}
${renderSpotGradient("spot-label", 714)}
<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
}

function renderWall({ updated, latest }) {
  const shortLatest = latest.length > MAX_LATEST_LENGTH ? `${latest.slice(0, MAX_LATEST_LENGTH - 1)}…` : latest;
  return `<g clip-path="url(#wall)">
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wall-gradient)"/>
<rect class="light" width="${WIDTH}" height="${HEIGHT}" fill="url(#spot-art)"/>
<rect class="light" style="animation-delay:.5s" width="${WIDTH}" height="${HEIGHT}" fill="url(#spot-label)" opacity=".6"/>
</g>
<circle class="pulse" cx="44" cy="40" r="4" fill="${PALETTE[2]}"/>
<text class="caps" x="56" y="44">LIVE · UPDATED ${updated.toUpperCase()}</text>
<text class="caps" x="${WIDTH - 40}" y="44" text-anchor="end">LATEST: ${escapeXml(shortLatest.toUpperCase())}</text>`;
}

function renderBloom(days) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const scale = RADIUS / Math.sqrt(days.length);
  const seeds = days.map((day, i) => renderSeed(day, i, { max, scale, total: days.length }));
  const newest = getPosition(days.length - 1, scale);
  const ring = `<circle class="ring" cx="${newest.x}" cy="${newest.y}" r="7" fill="none" stroke="${PAPER}" stroke-width="1.2"/>`;
  return `<g class="bloom">
<g filter="url(#glow)">${seeds.join("\n")}</g>
${ring}
</g>`;
}

function renderSeed({ count }, i, { max, scale, total }) {
  const { x, y } = getPosition(i, scale);
  const intensity = count ? Math.sqrt(count / max) : 0;
  const fill = count ? mixPalette(intensity) : SEED_COLOR;
  const delay = ((i / total) * 2.2).toFixed(3);
  return `<circle class="seed" style="animation-delay:${delay}s" cx="${x}" cy="${y}" r="${getSeedRadius(intensity)}" fill="${fill}"/>`;
}

function getSeedRadius(intensity) {
  return (intensity ? 2.8 + intensity * 5.8 : 1.6).toFixed(2);
}

function getPosition(index, scale) {
  const distance = scale * Math.sqrt(index + 0.5);
  const angle = index * GOLDEN_ANGLE;
  const x = CENTER.x + distance * Math.cos(angle);
  const y = CENTER.y + distance * Math.sin(angle);
  return { x: x.toFixed(2), y: y.toFixed(2) };
}

function renderLabel({ day, total, streak, repos }) {
  const x = 548;
  return `<g class="reveal">
<rect x="528" y="146" width="372" height="176" rx="3" fill="${PAPER}" filter="url(#shadow)"/>
<text x="${x}" y="176"><tspan class="artist">rekyi</tspan></text>
<text x="${x}" y="208"><tspan class="title">Bloom</tspan><tspan class="subtitle">, ${day} days</tspan></text>
<text class="medium" x="${x}" y="230">My GitHub contributions as a growing spiral</text>
<text class="text" x="${x}" y="256">One seed for every day since July 2026.</text>
<text class="text" x="${x}" y="274">Larger and brighter seeds mark busier days.</text>
<text class="text" x="${x}" y="292">A new one grows every night.</text>
<text class="meta" x="${x}" y="310">${total} CONTRIBUTIONS · ${streak}-DAY STREAK · ${repos} PUBLIC REPOS</text>
</g>`;
}

function renderLegend() {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const dots = steps.map((step, i) => {
    const fill = step ? mixPalette(step) : SEED_COLOR;
    return `<circle cx="${600 + i * 22}" cy="352" r="${getSeedRadius(step)}" fill="${fill}"/>`;
  });
  return `<g class="reveal" style="animation-delay:1.2s">
<text class="caps" x="548" y="356">LESS</text>${dots.join("")}<text class="caps" x="${600 + steps.length * 22}" y="356">MORE</text>
<circle cx="784" cy="352" r="5" fill="none" stroke="${PAPER}" stroke-width="1.2"/><text class="caps" x="796" y="356">TODAY</text>
</g>`;
}

function escapeXml(text) {
  return text.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
