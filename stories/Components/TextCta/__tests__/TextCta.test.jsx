import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TextCta } from '../TextCta';

describe('TextCta', () => {
  const defaultButtons = [
    { label: 'Read more', url: '/about' },
    { label: 'Contact us', url: '/contact', type: 'Secondary' },
  ];

  // --------------------------------------------------
  // Headline rendering
  // --------------------------------------------------

  it('renders headline text', () => {
    render(<TextCta headline="Join the platform" />);

    expect(screen.getByText('Join the platform')).toBeInTheDocument();
  });

  it('renders an optional eyebrow', () => {
    const { container } = render(
      <TextCta eyebrow="Open source" headline="Build with Mangrove" />
    );

    expect(container.querySelector('.mg-cta__eyebrow')).toHaveTextContent(
      'Open source'
    );
  });

  it('applies headlineSize class', () => {
    const { container } = render(
      <TextCta headline="Big heading" headlineSize="800" />
    );

    const heading = container.querySelector('.mg-cta__headline');
    expect(heading).toHaveClass('mg-u-font-size-800');
  });

  it('renders headline as h2 by default', () => {
    const { container } = render(<TextCta headline="Default level" />);

    const heading = container.querySelector('.mg-cta__headline');
    expect(heading.tagName).toBe('H2');
  });

  it('renders headline at a custom heading level', () => {
    const { container } = render(
      <TextCta headline="Custom level" headlineLevel={3} />
    );

    const heading = container.querySelector('.mg-cta__headline');
    expect(heading.tagName).toBe('H3');
  });

  // --------------------------------------------------
  // Text (dangerouslySetInnerHTML)
  // --------------------------------------------------

  it('renders sanitized HTML in text prop', () => {
    const { container } = render(
      <TextCta text="<p>Hello <strong>world</strong></p>" />
    );

    const textEl = container.querySelector('.mg-cta__text');
    expect(textEl.innerHTML).toContain('<strong>world</strong>');
  });

  it('strips dangerous HTML from text prop', () => {
    const { container } = render(
      <TextCta text='<p>Safe</p><script>alert("xss")</script>' />
    );

    const textEl = container.querySelector('.mg-cta__text');
    expect(textEl.innerHTML).toContain('Safe');
    expect(textEl.innerHTML).not.toContain('<script>');
  });

  // --------------------------------------------------
  // Buttons
  // --------------------------------------------------

  it('renders buttons as links', () => {
    render(<TextCta buttons={defaultButtons} />);

    const readMore = screen.getByRole('link', { name: 'Read more' });
    expect(readMore.tagName).toBe('A');
    expect(readMore).toHaveAttribute('href', '/about');
    expect(readMore).toHaveClass('mg-button-primary');

    const contact = screen.getByRole('link', { name: 'Contact us' });
    expect(contact).toHaveClass('mg-button-secondary');
  });

  it('defaults button href to # when url is missing', () => {
    render(<TextCta buttons={[{ label: 'Click' }]} />);

    expect(screen.getByRole('link', { name: 'Click' })).toHaveAttribute(
      'href',
      '#'
    );
  });

  it('composes button variants and external-link attributes', () => {
    render(
      <TextCta
        buttons={[
          {
            label: 'View source',
            url: 'https://example.com',
            type: 'Secondary',
            outline: true,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        ]}
      />
    );

    const link = screen.getByRole('link', { name: 'View source' });
    expect(link).toHaveClass('mg-button-secondary', 'mg-button-outline');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // --------------------------------------------------
  // Variant classes
  // --------------------------------------------------

  it('applies variant class', () => {
    const { container } = render(<TextCta variant="secondary" />);

    expect(container.firstChild).toHaveClass('mg-cta--secondary');
  });

  it('applies primary variant by default', () => {
    const { container } = render(<TextCta />);

    expect(container.firstChild).toHaveClass('mg-cta--primary');
  });

  // --------------------------------------------------
  // Image layout
  // --------------------------------------------------

  it('adds mg-cta--with-image class when image is set', () => {
    const { container } = render(
      <TextCta image="https://example.com/photo.jpg" imageAlt="A photo" />
    );

    expect(container.firstChild).toHaveClass('mg-cta--with-image');
    expect(container.firstChild).not.toHaveClass('mg-cta--centered');

    const img = screen.getByAltText('A photo');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  // --------------------------------------------------
  // Centered layout
  // --------------------------------------------------

  it('adds mg-cta--centered class when centered and no image', () => {
    const { container } = render(<TextCta centered />);

    expect(container.firstChild).toHaveClass('mg-cta--centered');
  });

  it('does not add mg-cta--centered when image is present', () => {
    const { container } = render(
      <TextCta centered image="https://example.com/photo.jpg" />
    );

    expect(container.firstChild).not.toHaveClass('mg-cta--centered');
  });

  it('uses the inline layout without centered treatment', () => {
    const { container } = render(<TextCta layout="inline" centered />);

    expect(container.firstChild).toHaveClass('mg-cta--inline');
    expect(container.firstChild).not.toHaveClass('mg-cta--centered');
  });

  // --------------------------------------------------
  // Custom background color
  // --------------------------------------------------

  it('sets --mg-cta-bg CSS variable from backgroundColor', () => {
    const { container } = render(<TextCta backgroundColor="#2c5f2d" />);

    expect(container.firstChild).toHaveStyle({ '--mg-cta-bg': '#2c5f2d' });
  });

  it('sets custom padding via style', () => {
    const { container } = render(<TextCta padding="8rem 0" />);

    expect(container.firstChild).toHaveStyle({ padding: '8rem 0' });
  });

  // --------------------------------------------------
  // Additional className
  // --------------------------------------------------

  it('appends custom className', () => {
    const { container } = render(<TextCta className="my-custom" />);

    expect(container.firstChild).toHaveClass('mg-cta', 'my-custom');
  });

  // --------------------------------------------------
  // Accessible name on section
  // --------------------------------------------------

  it('labels section via aria-labelledby when headline is present', () => {
    const { container } = render(<TextCta headline="Platform CTA" />);

    const section = container.querySelector('section');
    const heading = container.querySelector('.mg-cta__headline');
    expect(section).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('uses aria-label fallback when no headline is provided', () => {
    const { container } = render(<TextCta text="<p>Body only</p>" />);

    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-label', 'Call to action');
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <TextCta
        headline="Take action now"
        text="<p>Register for the conference.</p>"
        buttons={defaultButtons}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations with image', async () => {
    const { container } = render(
      <TextCta
        headline="Recovery Help Desk"
        buttons={[{ label: 'Learn more', url: '#' }]}
        image="https://example.com/photo.jpg"
        imageAlt="Help desk icon"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('composed CTA content', () => {
  it('keeps caller-owned form controls and existing actions independently accessible', async () => {
    const { container } = render(
      <TextCta
        headline="Stay informed"
        centered={false}
        buttons={[{ label: 'More information', url: '/about' }]}
      >
        <form aria-label="Subscribe">
          <label htmlFor="cta-email">Email address</label>
          <input id="cta-email" name="email" type="email" required />
          <button type="submit">Subscribe</button>
        </form>
      </TextCta>
    );
    expect(screen.getByRole('form', { name: 'Subscribe' })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Email address' })
    ).toHaveAttribute('name', 'email');
    expect(
      screen.getByRole('link', { name: 'More information' })
    ).toHaveAttribute('href', '/about');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds no content wrapper for existing button-only usage', () => {
    const { container } = render(
      <TextCta
        headline="Read more"
        buttons={[{ label: 'Read', url: '/read' }]}
      />
    );
    expect(
      container.querySelector('.mg-cta__custom-content')
    ).not.toBeInTheDocument();
  });
});

test('soft tone composes with accent variant without changing the default', () => {
  const { container, rerender } = render(
    <TextCta headline="Updates" tone="soft" variant="secondary" />
  );
  expect(container.querySelector('section')).toHaveClass(
    'mg-cta--soft',
    'mg-cta--secondary'
  );
  rerender(<TextCta headline="Updates" />);
  expect(container.querySelector('section')).not.toHaveClass('mg-cta--soft');
});

test('composed content uses stacked layout even when inline actions are requested', () => {
  const { container, rerender } = render(
    <TextCta
      headline="Updates"
      layout="inline"
      buttons={[{ label: 'Details', url: '/details' }]}
    >
      <p>Composed content</p>
    </TextCta>
  );
  expect(container.querySelector('section')).not.toHaveClass('mg-cta--inline');
  expect(screen.getByText('Composed content')).toBeInTheDocument();
  rerender(
    <TextCta
      headline="Updates"
      layout="inline"
      buttons={[{ label: 'Details', url: '/details' }]}
    />
  );
  expect(container.querySelector('section')).toHaveClass('mg-cta--inline');
});
