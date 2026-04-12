/**
 * @file ColorSwatch.jsx
 * @description Displays a color swatch with hex value, usage label, and click-to-copy.
 * Reads resolved color values from the browser via getComputedStyle on a hidden probe element.
 *
 * @module ColorSwatch
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './color-swatch.css';

/**
 * Returns white or dark text depending on background luminance.
 * Uses the ITU-R BT.601 perceived brightness formula.
 *
 * @param {string} hex - Hex color string (e.g., '#004f91')
 * @returns {'#fff'|'#1a1a1a'} Contrasting text color
 */
function contrastingText(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1a1a1a' : '#fff';
}

/**
 * Converts an rgb/rgba string to a hex string.
 *
 * @param {string} rgb - e.g., 'rgb(0, 79, 145)' or 'rgba(0, 79, 145, 1)'
 * @returns {string|null} Hex string (e.g., '#004f91') or null if unparseable
 */
function rgbToHex(rgb) {
  if (!rgb) return null;
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

/**
 * Color swatch that reads its color from the browser's computed styles.
 *
 * Renders a hidden probe element with the given CSS class, reads the resolved
 * color via getComputedStyle, and displays a visual swatch with hex value
 * and copy-to-clipboard support.
 *
 * @param {Object} props
 * @param {string} props.probe          CSS class to apply to the hidden probe element (e.g., 'mg-hero')
 * @param {string} [props.property='background-color'] CSS property to read from the probe
 * @param {string} [props.color]        Explicit hex color override (skips probing)
 * @param {string} props.name           Human-readable color name
 * @param {string} [props.usage]        Plain-language usage description
 */
export function ColorSwatch({
  probe,
  property = 'background-color',
  color: explicitColor,
  name,
  usage,
}) {
  const probeRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [probedHex, setProbedHex] = useState(null);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'

  // Probe CSS value for non-explicit colors
  useEffect(() => {
    if (explicitColor || !probeRef.current) return;
    const computed = window.getComputedStyle(probeRef.current);
    const raw = computed.getPropertyValue(property);
    const resolved = rgbToHex(raw);
    if (resolved && resolved !== '#000000') {
      setProbedHex(resolved);
    }
  }, [probe, property, explicitColor]);

  // Use explicit color directly (not stored in state) so prop changes take effect
  const hex = explicitColor || probedHex;

  useEffect(() => {
    return () => clearTimeout(copyTimerRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!hex) return;
    clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(hex);
      setCopyState('copied');
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('failed');
      copyTimerRef.current = setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [hex]);

  const textColor = hex ? contrastingText(hex) : '#1a1a1a';
  const displayHex = hex || '#000000';

  return (
    <div className="mg-color-swatch">
      {/* Hidden probe element for CSS extraction */}
      {!explicitColor && probe && (
        <div
          ref={probeRef}
          className={probe}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        />
      )}

      <button
        type="button"
        className="mg-color-swatch__block"
        style={{ backgroundColor: displayHex }}
        onClick={handleCopy}
        aria-label={`Copy hex value ${displayHex} for ${name}`}
      >
        <span
          className="mg-color-swatch__hex"
          style={{ color: textColor }}
        >
          {copyState === 'copied'
            ? 'Copied!'
            : copyState === 'failed'
              ? 'Copy failed'
              : displayHex}
        </span>
      </button>

      <div className="mg-color-swatch__info">
        <span className="mg-color-swatch__name">{name}</span>
        {usage && <span className="mg-color-swatch__usage">{usage}</span>}
      </div>
    </div>
  );
}

ColorSwatch.propTypes = {
  /** CSS class to apply to the hidden probe element for color extraction. */
  probe: PropTypes.string,
  /** CSS property to read from the probe element. */
  property: PropTypes.string,
  /** Explicit hex color override (skips probing). */
  color: PropTypes.string,
  /** Human-readable color name. */
  name: PropTypes.string.isRequired,
  /** Plain-language usage description. */
  usage: PropTypes.string,
};
