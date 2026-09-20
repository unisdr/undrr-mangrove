import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ShowMore } from '../ShowMore';

const item = (buttonText, text) => ({
  button_text: buttonText,
  collapsable_wrapper_class: 'show-more-wrapper-class',
  collapsable_text: text,
});

describe('ShowMore', () => {
  it('initialises new items after empty data without changing existing open items', () => {
    const { rerender } = render(<ShowMore data={[]} />);
    rerender(<ShowMore data={[item('Show more', 'First block')]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText('First block')).not.toHaveClass(
      'mg-show-more--collapsed'
    );
    rerender(
      <ShowMore
        data={[
          item('Show more', 'First block'),
          item('Show more', 'Second block'),
        ]}
      />
    );
    expect(screen.getByText('First block')).not.toHaveClass(
      'mg-show-more--collapsed'
    );
    expect(screen.getByText('Second block')).toHaveClass(
      'mg-show-more--collapsed'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByText('Second block')).not.toHaveClass(
      'mg-show-more--collapsed'
    );
  });

  it('does not initialise another subtree', () => {
    const { container } = render(
      <div>
        <div className="mg-show-more--container">Unrelated</div>
        <button data-mg-show-more="true">Other toggle</button>
        <ShowMore data={[item('Show more', 'Owned block')]} />
      </div>
    );
    expect(
      screen.getByRole('button', { name: 'Other toggle' })
    ).not.toHaveAttribute('data-mg-show-more-initialized');
    expect(container.querySelector('.mg-show-more--container')).not.toHaveClass(
      'mg-show-more--collapsed'
    );
  });

  it('updates translated labels in both states and keeps instance labels separate', () => {
    const data = [item('Legacy label', 'First block')];
    const { rerender } = render(
      <ShowMore data={data} labelCollapsed="عرض المزيد" labelOpen="عرض أقل" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'عرض المزيد' }));
    expect(screen.getByRole('button', { name: 'عرض أقل' })).toBeInTheDocument();
    rerender(
      <ShowMore data={data} labelCollapsed="Voir plus" labelOpen="Voir moins" />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Voir moins' }));
    expect(
      screen.getByRole('button', { name: 'Voir plus' })
    ).toBeInTheDocument();
    render(<ShowMore data={[item('Old', 'Other block')]} />);
    expect(
      screen.getByRole('button', { name: 'Show more' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Voir plus' })
    ).toBeInTheDocument();
  });

  it('cleans up listeners and survives StrictMode effect replay', () => {
    const { unmount } = render(
      <React.StrictMode>
        <ShowMore data={[item('Show more', 'First block')]} />
      </React.StrictMode>
    );
    const button = screen.getByRole('button', { name: 'Show more' });
    const target = screen.getByText('First block');
    fireEvent.click(button);
    expect(target).not.toHaveClass('mg-show-more--collapsed');
    unmount();
    fireEvent.click(button);
    expect(target).not.toHaveClass('mg-show-more--collapsed');
    expect(button).not.toHaveAttribute('data-mg-show-more-initialized');
  });

  it('renders a wrapper and a toggle for each item', () => {
    render(<ShowMore data={[item('Show more', 'First block')]} />);

    expect(screen.getByText('First block')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show (more|less)/i })
    ).toBeInTheDocument();
  });

  it('renders nothing for an empty data array', () => {
    const { container } = render(<ShowMore data={[]} />);
    expect(container.querySelectorAll('[data-mg-show-more]')).toHaveLength(0);
  });

  // Two items share `collapsable_wrapper_class` here on purpose: the prop is a
  // styling hook and consumers are not asked to keep it unique. The toggles
  // used to target `.${collapsable_wrapper_class}`, so both drove the first
  // wrapper. Flat siblings share a parent, so the vanilla script's ancestor
  // walk cannot separate them — each item needs its own id (#1228).
  describe('two items on one page', () => {
    it('gives each toggle its own content', () => {
      const { container } = render(
        <ShowMore
          data={[
            item('Show more', 'First block'),
            item('Show more', 'Second block'),
          ]}
        />
      );

      const toggles = container.querySelectorAll('[data-mg-show-more]');
      expect(toggles).toHaveLength(2);

      const firstId = toggles[0].getAttribute('aria-controls');
      const secondId = toggles[1].getAttribute('aria-controls');
      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toBe(secondId);

      const first = document.getElementById(firstId);
      const second = document.getElementById(secondId);
      expect(first).toHaveTextContent('First block');
      expect(second).toHaveTextContent('Second block');

      // Init clicks each toggle once, so both start collapsed.
      expect(first.classList.contains('mg-show-more--collapsed')).toBe(true);
      expect(second.classList.contains('mg-show-more--collapsed')).toBe(true);

      fireEvent.click(toggles[1]);

      expect(second.classList.contains('mg-show-more--collapsed')).toBe(false);
      expect(first.classList.contains('mg-show-more--collapsed')).toBe(true);
    });

    it('keeps the wrapper class on both items', () => {
      const { container } = render(
        <ShowMore
          data={[
            item('Show more', 'First block'),
            item('Show more', 'Second block'),
          ]}
        />
      );

      expect(
        container.querySelectorAll('.show-more-wrapper-class')
      ).toHaveLength(2);
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ShowMore
        data={[
          item('Show more', 'First block'),
          item('Show more', 'Second block'),
        ]}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
