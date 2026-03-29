import shareButtonsFromElement from '../ShareButtons.fromElement';

function createContainer(attrs = {}) {
  const el = document.createElement('section');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('shareButtonsFromElement', () => {
  it('returns default labels when no data attributes set', () => {
    const container = createContainer();
    const props = shareButtonsFromElement(container);

    expect(props.labels.mainLabel).toBe('Share this');
    expect(props.labels.onCopy).toBe('Link copied');
    expect(props.sharingSubject).toBe('Sharing Link');
    expect(props.sharingBody).toBe('');
  });

  it('extracts localized labels from data attributes', () => {
    const container = createContainer({
      'main-label': 'Partager',
      'on-copy-label': 'Lien copié',
      'sharing-subject': 'Partage de lien',
      'sharing-body': 'Consultez ce lien : ',
    });
    const props = shareButtonsFromElement(container);

    expect(props.labels.mainLabel).toBe('Partager');
    expect(props.labels.onCopy).toBe('Lien copié');
    expect(props.sharingSubject).toBe('Partage de lien');
    expect(props.sharingBody).toBe('Consultez ce lien : ');
  });

  it('falls back to defaults for missing attributes', () => {
    const container = createContainer({
      'main-label': 'カスタム',
    });
    const props = shareButtonsFromElement(container);

    expect(props.labels.mainLabel).toBe('カスタム');
    expect(props.labels.onCopy).toBe('Link copied');
    expect(props.sharingSubject).toBe('Sharing Link');
    expect(props.sharingBody).toBe('');
  });
});
