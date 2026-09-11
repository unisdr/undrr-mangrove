/**
 * Perceptual lightness contrast, on Oklab.
 *
 * WHY THIS EXISTS
 * WCAG 2's contrast ratio compares relative luminance, which is not
 * perceptually uniform. It misjudges mid-tones and light-on-dark badly, so two
 * pairs with the same ratio can be visibly different to read. This measures
 * lightness difference in Oklab, where a given numeric step is intended to look
 * like the same step anywhere on the scale.
 *
 * WHY OKLAB
 * Oklab (Björn Ottosson, 2020) is defined in CSS Color Level 4, a W3C
 * specification in the public domain, and browsers compute oklab()/oklch()
 * natively. There is no licence, patent or trademark attached to using it.
 *
 * PRECEDENT
 * Canonical reached the same conclusion independently while building Ubuntu's
 * palette: they explored an APCA-inspired generator, then shipped a
 * WCAG-anchored approach, noting "I'm not sure if what I did is compatible with
 * the APCA trademark license, so I'll refrain from claiming that my result is
 * APCA-compliant".
 * https://canonical.design/blog/generating-color-palettes-for-design-systems-inspired-by-apca
 *
 * ServiceNow's Horizon design system layers a perceptual measure on top of
 * WCAG 2 rather than replacing it. Nobody credible has swapped WCAG 2 out,
 * because there is no successor standard to swap to.
 *
 * WHAT THIS IS NOT
 * This is not APCA and does not claim to be. APCA is patent-pending, carries a
 * restrictive licence and a trademark condition, and was removed from WCAG 3 in
 * 2023 without replacement - the April 2026 Editor's Draft still says "the
 * contrast algorithm used in WCAG 3 is yet to be determined". Nor is this
 * WCAG 2: it will disagree with it, which is the point.
 *
 * KNOWN LIMITATIONS, stated rather than buried
 * - Polarity-insensitive. Dark-on-light and light-on-dark of the same pair score
 *   the same. Real perception is not symmetric; APCA models that and this does
 *   not.
 * - Not size or weight aware. Thresholds below assume body text. Large or bold
 *   text is genuinely readable lower down, and this does not model that beyond
 *   the coarse LARGE_TEXT threshold.
 * - Assumes sRGB, a lit screen and an average viewing environment.
 *
 * CALIBRATION, which is the methodology
 * Thresholds are anchored to the two boundaries the field already agrees on,
 * then the perceptual curve governs between and beyond them:
 *
 *   #767676 on white is exactly WCAG 2's 4.5:1 body-text boundary -> 63.3 here
 *   #949494 on white is exactly WCAG 2's 3.0:1 non-text boundary  -> 50.0 here
 *
 * So a pair that WCAG 2 puts precisely on a boundary lands on the same boundary
 * here, and the two measures diverge only where WCAG 2 is unreliable. That is
 * deliberate: it means adopting this does not silently re-baseline every colour
 * decision already made.
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
