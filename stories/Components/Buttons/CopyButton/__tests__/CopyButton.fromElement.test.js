import copyButtonFromElement from '../CopyButton.fromElement';

describe('copyButtonFromElement', () => {
  function makeContainer(attrs = {}) {
    const el = document.createElement('button');
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(`data-${key}`, value);
    });
    return el;
  }

  it('returns default props when no data attributes are set', () => {
    const el = makeContainer();
    const props = copyButtonFromElement(el);

    expect(props).toEqual({
      textToCopy: '',
      ariaLabel: undefined,
      copiedLabel: undefined,
      tooltipLabel: undefined,
      variant: 'outline',
      size: undefined,
      className: undefined,
    });
  });

  it('extracts props using standard data-text-to-copy attributes', () => {
    const el = makeContainer({
      'text-to-copy': 'https://preventionweb.net',
      'aria-label': 'Copy URL',
      'copied-label': 'URL copied to clipboard',
      'tooltip-label': 'Done!',
      variant: 'primary',
      size: 'small',
      'class-name': 'my-custom-btn',
    });
    const props = copyButtonFromElement(el);

    expect(props).toEqual({
      textToCopy: 'https://preventionweb.net',
      ariaLabel: 'Copy URL',
      copiedLabel: 'URL copied to clipboard',
      tooltipLabel: 'Done!',
      variant: 'primary',
      size: 'small',
      className: 'my-custom-btn',
    });
  });

  it('supports shorthand aliases (text, label, feedbackText, ariaLiveText)', () => {
    const el = makeContainer({
      text: 'Short text',
      label: 'Copy link',
      'feedback-text': 'Copied!',
      'aria-live-text': 'Text copied',
    });
    const props = copyButtonFromElement(el);

    expect(props.textToCopy).toBe('Short text');
    expect(props.ariaLabel).toBe('Copy link');
    expect(props.tooltipLabel).toBe('Copied!');
    expect(props.copiedLabel).toBe('Text copied');
  });

  it('parses data-labels JSON attribute', () => {
    const el = makeContainer({
      text: 'Sample',
      labels: JSON.stringify({
        ariaLabel: 'Copiar al portapapeles',
        tooltipLabel: '¡Copiado!',
        copiedLabel: 'Copiado al portapapeles.',
      }),
    });
    const props = copyButtonFromElement(el);

    expect(props.ariaLabel).toBe('Copiar al portapapeles');
    expect(props.tooltipLabel).toBe('¡Copiado!');
    expect(props.copiedLabel).toBe('Copiado al portapapeles.');
  });

  describe('accessible name', () => {
    it('reads a plain aria-label, which is what the docs teach', () => {
      const el = makeContainer({ 'text-to-copy': 'https://example.org' });
      el.setAttribute('aria-label', 'Copy glossary link');

      expect(copyButtonFromElement(el).ariaLabel).toBe('Copy glossary link');
    });

    it('prefers aria-label over the legacy data-aria-label spelling', () => {
      const el = makeContainer({ 'aria-label': 'Legacy name' });
      el.setAttribute('aria-label', 'Real name');

      expect(copyButtonFromElement(el).ariaLabel).toBe('Real name');
    });

    it('still falls back to data-aria-label for markup already in the wild', () => {
      const el = makeContainer({ 'aria-label': 'Legacy name' });

      expect(copyButtonFromElement(el).ariaLabel).toBe('Legacy name');
    });
  });
});
