/**
 * Perceptual lightness contrast, on Oklab.
 *
 * Purpose: supplement WCAG 2 contrast checks with an Oklab lightness-distance
 * measure that tracks perceived differences more consistently across tones.
 *
 * Scope and limits:
 * - Not APCA, and does not claim APCA compliance.
 * - Polarity-insensitive (dark-on-light and light-on-dark are symmetric here).
 * - Not font-size/weight aware beyond the coarse LARGE_TEXT threshold.
 * - Assumes sRGB on a typical lit display environment.
 *
 * Calibration anchors (to keep existing WCAG boundaries intuitive):
 * - #767676 on white (WCAG 4.5:1 body text) maps to ~63 here.
 * - #949494 on white (WCAG 3.0:1 non-text/large-text) maps to ~50 here.
 */

const P = 1.618; // phi
const Q = 0.618; // 1/phi
const K = 1.414; // sqrt 2
const OFFSET = 40;
const NORM = Math.pow(100, P * Q - 1);

const srgbToLinear = c => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/** Oklab coordinates for an [r,g,b] triple in 0-255. */
function oklab([R, G, B]) {
  const r = srgbToLinear(R);
  const g = srgbToLinear(G);
  const b = srgbToLinear(B);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** Perceptual lightness of an [r,g,b] triple, 0-100. */
const lightness = rgb => oklab(rgb).L * 100;

/**
 * Perceptual contrast between two [r,g,b] triples. Roughly 0-100; higher is
 * more readable. Symmetric: argument order does not matter.
 */
function perceptualContrast(a, b) {
  const la = lightness(a);
  const lb = lightness(b);
  const raw = Math.pow(Math.abs(Math.pow(lb, P) - Math.pow(la, P)), Q);
  return (raw * K) / NORM - OFFSET;
}

/** Calibrated thresholds. See CALIBRATION above. */
const THRESHOLD = {
  BODY_TEXT: 63,
  LARGE_TEXT: 50,
  NON_TEXT: 50,
};

module.exports = { oklab, lightness, perceptualContrast, THRESHOLD };
