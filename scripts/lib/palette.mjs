export const PALETTE = ['#5b5bd6', '#e0457b', '#ffc857'];
export const SEED_COLOR = '#3b3d48';
export const PAPER = '#ece6da';

export function mixPalette(intensity) {
  const segment = intensity <= 0.5 ? 0 : 1;
  const local = segment === 0 ? intensity / 0.5 : (intensity - 0.5) / 0.5;
  const [from, to] = [PALETTE[segment], PALETTE[segment + 1]].map(toRgb);
  const mixed = from.map((channel, k) => Math.round(channel + (to[k] - channel) * local));
  return `rgb(${mixed.join(',')})`;
}

function toRgb(hex) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}
