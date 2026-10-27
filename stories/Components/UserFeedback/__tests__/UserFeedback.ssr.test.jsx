/** @jest-environment node */

import React from 'react';
import { renderToString } from 'react-dom/server';
import UserFeedback, { getUserFeedbackLabels } from '../UserFeedback.hydrate';

describe('UserFeedback server rendering', () => {
  it('renders a selected language without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');

    const html = renderToString(<UserFeedback lang="ar-EG" />);

    expect(html).toContain('lang="ar-EG"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(getUserFeedbackLabels('ar').question);
    expect(html).toContain('نعم');
  });

  it.each(['de-DE', 'he-IL', 'ur-PK'])(
    'preserves custom %s language and inherited direction without a DOM',
    lang => {
      const html = renderToString(
        <div dir="rtl">
          <UserFeedback
            lang={lang}
            labels={{ question: 'Custom translation' }}
          />
        </div>
      );

      expect(html).toContain(`lang="${lang}"`);
      expect(html).toContain('Custom translation');
      expect(html.match(/dir=/g)).toHaveLength(1);
      expect(html).toContain('dir="rtl"');
    }
  );

  it('keeps English and custom labels working without a language', () => {
    const html = renderToString(<UserFeedback labels={{ yes: 'Useful' }} />);

    expect(html).toContain('Is this page useful?');
    expect(html).toContain('Useful');
    expect(html).not.toContain('lang=');
    expect(html).not.toContain('dir=');
  });
});
