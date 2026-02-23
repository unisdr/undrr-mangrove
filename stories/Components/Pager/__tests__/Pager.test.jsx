import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Pager } from '../Pager';

describe('Pager', () => {
  const onPageChange = jest.fn();

  afterEach(() => {
    onPageChange.mockClear();
  });

  // --------------------------------------------------
  // Rendering page numbers
  // --------------------------------------------------

  it('renders correct page numbers for page 3 of 20', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    // Should show page 1 through 5 and 20
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3, current page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 20')).toBeInTheDocument();
  });

  it('shows ellipsis for non-adjacent pages', () => {
    render(<Pager page={10} totalPages={20} onPageChange={onPageChange} />);

    const nav = screen.getByRole('navigation');
    const ellipses = nav.querySelectorAll('.mg-pager__ellipsis');
    expect(ellipses.length).toBe(2);
  });

  it('hides pagination when totalPages is 1', () => {
    const { container } = render(
      <Pager page={1} totalPages={1} onPageChange={onPageChange} />,
    );

    // PagerList returns null, so the list should not be present
    expect(container.querySelector('.mg-pager__list')).toBeNull();
  });

  it('renders few pages without ellipsis', () => {
    render(<Pager page={2} totalPages={3} onPageChange={onPageChange} />);

    const nav = screen.getByRole('navigation');
    expect(nav.querySelectorAll('.mg-pager__ellipsis').length).toBe(0);
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2, current page')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Navigation callbacks
  // --------------------------------------------------

  it('calls onPageChange with correct page on button click', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText('Page 5'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('calls onPageChange when clicking Previous', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText('Go to previous page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking Next', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByLabelText('Go to next page'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  // --------------------------------------------------
  // Disabled states
  // --------------------------------------------------

  it('disables Previous on page 1', () => {
    render(<Pager page={1} totalPages={20} onPageChange={onPageChange} />);

    expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
  });

  it('disables Next on last page', () => {
    render(<Pager page={20} totalPages={20} onPageChange={onPageChange} />);

    expect(screen.getByLabelText('Go to next page')).toBeDisabled();
  });

  // --------------------------------------------------
  // Keyboard navigation
  // --------------------------------------------------

  it('responds to Enter key on page button', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.keyDown(screen.getByLabelText('Page 5'), { key: 'Enter' });
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('responds to Space key on page button', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    fireEvent.keyDown(screen.getByLabelText('Page 5'), { key: ' ' });
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  // --------------------------------------------------
  // aria-current
  // --------------------------------------------------

  it('sets aria-current="page" on active page', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    const currentBtn = screen.getByLabelText('Page 3, current page');
    expect(currentBtn).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on non-active pages', () => {
    render(<Pager page={3} totalPages={20} onPageChange={onPageChange} />);

    const otherBtn = screen.getByLabelText('Page 4');
    expect(otherBtn).not.toHaveAttribute('aria-current');
  });

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  it('disables all controls when isLoading is true', () => {
    render(
      <Pager page={3} totalPages={20} isLoading onPageChange={onPageChange} />,
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // --------------------------------------------------
  // Mini pager (unknown total)
  // --------------------------------------------------

  it('renders mini pager when totalPages is null', () => {
    render(<Pager page={5} totalPages={null} onPageChange={onPageChange} />);

    // Should show current page
    expect(screen.getByLabelText('Page 5, current page')).toBeInTheDocument();
    // Next should be enabled (unknown total)
    expect(screen.getByLabelText('Go to next page')).not.toBeDisabled();
  });

  // --------------------------------------------------
  // Bar layout
  // --------------------------------------------------

  it('renders bar layout with three zones', () => {
    const { container } = render(
      <Pager
        page={3}
        totalPages={20}
        onPageChange={onPageChange}
        layout="bar"
        range={{ start: 21, end: 30 }}
        showJumpTo
      />,
    );

    expect(container.querySelector('.mg-pager__bar')).toBeInTheDocument();
    expect(container.querySelector('.mg-pager__range')).toBeInTheDocument();
    expect(container.querySelector('.mg-pager__list')).toBeInTheDocument();
    expect(container.querySelector('.mg-pager__jump')).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Range display
  // --------------------------------------------------

  it('shows range text when range prop is provided', () => {
    render(
      <Pager
        page={3}
        totalPages={20}
        onPageChange={onPageChange}
        layout="bar"
        range={{ start: 21, end: 30 }}
        rangeLabel="Showing {start}–{end}"
      />,
    );

    expect(screen.getByText(/Showing 21–30/)).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Jump-to-page form
  // --------------------------------------------------

  it('calls onPageChange on jump form submit', () => {
    render(
      <Pager
        page={1}
        totalPages={20}
        onPageChange={onPageChange}
        layout="bar"
        showJumpTo
      />,
    );

    const input = screen.getByLabelText('Go to page');
    const goBtn = screen.getByRole('button', { name: 'Go' });

    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.click(goBtn);

    expect(onPageChange).toHaveBeenCalledWith(15);
  });

  it('clamps jump value to totalPages', () => {
    const { container } = render(
      <Pager
        page={1}
        totalPages={10}
        onPageChange={onPageChange}
        layout="bar"
        showJumpTo
      />,
    );

    const input = screen.getByLabelText('Go to page');
    // Set value directly to bypass HTML5 number-input max constraint in jsdom
    fireEvent.change(input, { target: { value: '999' } });

    const form = container.querySelector('.mg-pager__jump');
    fireEvent.submit(form);

    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  // --------------------------------------------------
  // Empty / notice state
  // --------------------------------------------------

  it('shows notice when emptyState is provided', () => {
    render(
      <Pager
        page={1}
        onPageChange={onPageChange}
        emptyState="No results found."
      />,
    );

    expect(screen.getByText('No results found.')).toBeInTheDocument();
    // Should NOT render any page buttons
    expect(screen.queryByLabelText(/Page \d/)).toBeNull();
  });

  it('shows notice with action button', () => {
    const actionFn = jest.fn();
    render(
      <Pager
        page={1}
        onPageChange={onPageChange}
        emptyState="No results found."
        emptyAction={{ label: 'Reset', onClick: actionFn }}
      />,
    );

    const actionBtn = screen.getByText('Reset');
    fireEvent.click(actionBtn);
    expect(actionFn).toHaveBeenCalled();
  });

  // --------------------------------------------------
  // Accessibility
  // --------------------------------------------------

  it('has no a11y violations', async () => {
    const { container } = render(
      <Pager page={3} totalPages={20} onPageChange={onPageChange} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no a11y violations in bar layout', async () => {
    const { container } = render(
      <Pager
        page={3}
        totalPages={20}
        onPageChange={onPageChange}
        layout="bar"
        range={{ start: 21, end: 30 }}
        showJumpTo
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
