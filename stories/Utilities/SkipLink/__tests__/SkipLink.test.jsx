import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SkipLink } from '../SkipLink';

/** The markup a consuming page is expected to provide around the link. */
function Page({ targetId = 'main-content', ...props }) {
  return (
    <div>
      <SkipLink targetId={targetId} {...props} />
      <header>
        <a href="#nav">Navigation link</a>
      </header>
      <main id={targetId} tabIndex={-1}>
        <h1>Page title</h1>
      </main>
    </div>
  );
}

describe('SkipLink', () => {
  it('renders an anchor pointing at the default main content id', () => {
    render(<Page />);

    expect(
      screen.getByRole('link', { name: 'Skip to main content' })
    ).toHaveAttribute('href', '#main-content');
  });

  it('takes its label and target from props', () => {
    render(<Page targetId="hub-content" label="تخطي إلى المحتوى الرئيسي" />);

    expect(
      screen.getByRole('link', { name: 'تخطي إلى المحتوى الرئيسي' })
    ).toHaveAttribute('href', '#hub-content');
  });

  it('carries the component class and any extra classes', () => {
    render(<Page className="custom-class" />);

    expect(screen.getByRole('link', { name: /Skip/ })).toHaveClass(
      'mg-skip-link',
      'custom-class'
    );
  });

  it('moves focus to the target, not just the scroll position', () => {
    render(<Page />);

    fireEvent.click(screen.getByRole('link', { name: /Skip/ }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('does not throw when the target is missing from the page', () => {
    render(<SkipLink targetId="absent" />);

    expect(() => fireEvent.click(screen.getByRole('link'))).not.toThrow();
  });

  it('calls a consumer click handler after moving focus', () => {
    const onClick = jest.fn();
    render(<Page onClick={onClick} />);

    fireEvent.click(screen.getByRole('link', { name: /Skip/ }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('is the first element in tab order', () => {
    render(<Page />);

    const focusable = document.querySelectorAll('a, main[tabindex]');

    expect(focusable[0]).toBe(screen.getByRole('link', { name: /Skip/ }));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Page />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
