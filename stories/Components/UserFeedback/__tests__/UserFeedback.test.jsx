import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import UserFeedback, { getUserFeedbackLabels } from '../UserFeedback';
import fromElement from '../UserFeedback.fromElement';

describe('UserFeedback', () => {
  it('renders the prompt and detailed-feedback link', () => {
    render(<UserFeedback feedbackUrl="/feedback" />);

    expect(
      screen.getByRole('region', { name: 'Is this page useful?' })
    ).toHaveClass('mg-container', 'mg-grid', 'mg-grid__col-2');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute(
      'data-mg-user-feedback-type',
      'yes'
    );
    expect(
      screen.getByRole('link', { name: 'Report an issue on this page' })
    ).toHaveAttribute('href', '/feedback');
  });

  it.each(['yes', 'no'])(
    'records a %s response and focuses confirmation',
    value => {
      const onResponse = jest.fn();
      render(<UserFeedback feedbackUrl="/feedback" onResponse={onResponse} />);

      fireEvent.click(
        screen.getByRole('button', {
          name: value === 'yes' ? 'Yes' : 'No',
        })
      );

      expect(onResponse).toHaveBeenCalledWith(value);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      const confirmation = screen.getByText(/Thank you for your feedback/);
      expect(confirmation).toHaveFocus();
      expect(
        screen.getByRole('link', { name: 'tell us more' })
      ).toHaveAttribute('target', '_blank');
    }
  );

  it('merges localised labels with English defaults', () => {
    render(<UserFeedback labels={{ question: '¿Es útil?', yes: 'Sí' }} />);

    expect(
      screen.getByRole('region', { name: '¿Es útil?' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
  });

  it.each([
    ['ar', 'نعم', 'rtl'],
    ['es', 'Sí', 'ltr'],
    ['fr', 'Oui', 'ltr'],
    ['ja', 'はい', 'ltr'],
    ['ru', 'Да', 'ltr'],
    ['zh', '是', 'ltr'],
  ])('renders the built-in %s translation', (lang, yes, direction) => {
    render(<UserFeedback lang={lang} />);

    expect(screen.getByRole('button', { name: yes })).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('lang', lang);
    expect(screen.getByRole('region')).toHaveAttribute('dir', direction);
  });

  it('keeps custom labels ahead of language defaults in both states', () => {
    const onResponse = jest.fn();
    render(
      <UserFeedback
        lang="ar-EG"
        labels={{ yes: 'موافق', confirmationLink: 'المزيد' }}
        onResponse={onResponse}
      />
    );
    const region = screen.getByRole('region', {
      name: 'هل كانت هذه الصفحة مفيدة؟',
    });
    fireEvent.click(screen.getByRole('button', { name: 'موافق' }));

    expect(onResponse).toHaveBeenCalledWith('yes');
    expect(region).toHaveAttribute('lang', 'ar-EG');
    expect(screen.getByText(/شكراً لملاحظاتك/)).toHaveFocus();
    expect(screen.getByRole('link', { name: 'المزيد' })).toBeInTheDocument();
    expect(region).toHaveAccessibleName('هل كانت هذه الصفحة مفيدة؟');
  });

  it('renders inherited hydration language with existing data label overrides', () => {
    const parent = document.createElement('div');
    parent.lang = 'fr-CA';
    const container = parent.appendChild(document.createElement('div'));
    container.dataset.yesLabel = 'D’accord';
    render(<UserFeedback {...fromElement(container)} />);

    expect(
      screen.getByRole('heading', {
        name: 'Cette page vous a-t-elle été utile ?',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'D’accord' })
    ).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('lang', 'fr-CA');
  });

  it('uses English for unsupported languages and preserves direction overrides', () => {
    render(<UserFeedback lang="de-DE" dir="rtl" />);

    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('lang', 'de-DE');
    expect(screen.getByRole('region')).toHaveAttribute('dir', 'rtl');
  });

  it('preserves a custom language tag without rewriting its direction', () => {
    render(
      <UserFeedback
        lang="de-DE"
        labels={{
          question: 'Ist diese Seite hilfreich?',
          yes: 'Ja',
          no: 'Nein',
        }}
      />
    );

    const region = screen.getByRole('region', {
      name: 'Ist diese Seite hilfreich?',
    });
    expect(region).toHaveAttribute('lang', 'de-DE');
    expect(region).not.toHaveAttribute('dir');
    expect(screen.getByRole('button', { name: 'Ja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nein' })).toBeInTheDocument();
  });

  it.each([
    ['he-IL', 'האם הדף שימושי?', 'כן'],
    ['ur-PK', 'کیا یہ صفحہ مفید ہے؟', 'جی ہاں'],
  ])(
    'preserves inherited RTL for custom %s hydration labels',
    (lang, question, yes) => {
      const parent = document.createElement('section');
      parent.lang = lang;
      parent.dir = 'rtl';
      document.body.appendChild(parent);
      const container = parent.appendChild(document.createElement('div'));
      container.dataset.question = question;
      container.dataset.yesLabel = yes;
      render(<UserFeedback {...fromElement(container)} />, { container });

      const region = screen.getByRole('region', { name: question });
      expect(region).toHaveAttribute('lang', lang);
      expect(region).not.toHaveAttribute('dir');
      expect(region.closest('[dir]')).toBe(parent);
      expect(screen.getByRole('button', { name: yes })).toBeInTheDocument();
    }
  );

  it('composes Japanese confirmation without inserting English spaces', () => {
    render(<UserFeedback lang="ja-JP" />);
    fireEvent.click(screen.getByRole('button', { name: 'はい' }));

    expect(screen.getByText(/ご意見ありがとうございます/).textContent).toBe(
      'ご意見ありがとうございます。よろしければ、詳細をお聞かせください。'
    );
  });

  it.each([undefined, 'ar'])(
    'has no accessibility violations for %s',
    async lang => {
      const { container } = render(<UserFeedback lang={lang} />);
      expect(await axe(container)).toHaveNoViolations();
      const { yes } = getUserFeedbackLabels(lang);
      fireEvent.click(screen.getByRole('button', { name: yes }));
      expect(await axe(container)).toHaveNoViolations();
    }
  );

  it('has no automated accessibility violations', async () => {
    const { container } = render(<UserFeedback />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
