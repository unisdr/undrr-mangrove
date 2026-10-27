import userFeedbackFromElement from '../UserFeedback.fromElement';

describe('userFeedbackFromElement', () => {
  it('extracts the URL and translated labels', () => {
    const container = document.createElement('div');
    container.dataset.feedbackUrl = '/feedback';
    container.dataset.question = 'Utile ?';
    container.dataset.yesLabel = 'Oui';

    expect(userFeedbackFromElement(container)).toEqual({
      feedbackUrl: '/feedback',
      labels: { question: 'Utile ?', yes: 'Oui' },
    });
  });

  it('uses the UNDRR feedback URL and leaves label fallbacks to React', () => {
    const container = document.createElement('div');
    const props = userFeedbackFromElement(container);

    expect(props.feedbackUrl).toBe(
      'https://www.undrr.org/contact/website-feedback'
    );
    expect(props.labels).toEqual({});
  });

  it('takes data-lang before the container or surrounding HTML language', () => {
    const parent = document.createElement('section');
    parent.lang = 'ar';
    const container = parent.appendChild(document.createElement('div'));
    container.lang = 'fr';
    container.dataset.lang = 'es-MX';

    expect(userFeedbackFromElement(container).lang).toBe('es-MX');
    delete container.dataset.lang;
    expect(userFeedbackFromElement(container).lang).toBe('fr');
    container.removeAttribute('lang');
    expect(userFeedbackFromElement(container).lang).toBe('ar');
  });

  it('inherits the document language without reading a global document', () => {
    const document = window.document.implementation.createHTMLDocument();
    document.documentElement.lang = 'zh-Hans';
    const container = document.body.appendChild(document.createElement('div'));

    expect(userFeedbackFromElement(container).lang).toBe('zh-Hans');
  });

  it('keeps an explicit empty language as an English fallback boundary', () => {
    const parent = document.createElement('section');
    parent.lang = 'ar';
    const container = parent.appendChild(document.createElement('div'));
    container.lang = '';

    expect(userFeedbackFromElement(container).lang).toBe('');
    container.dataset.lang = '';
    expect(userFeedbackFromElement(container).lang).toBe('');
  });
});
