const UNDRR = window.UNDRR || {};

UNDRR.keyCode = {
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
};

UNDRR.breakpoints = {
  TINY: 320,
  SMALL: 767,
  MEDIUM: 768,
  LARGE: 1024,
  EXTRALARGE: 1440,
  MEDIUMTAB: 1439,
  TABLET: 834,
};

window.UNDRR = window.UNDRR || UNDRR;

export const desktopView = window.innerWidth > 1439;
