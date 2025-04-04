import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ScrollContainer from '../ScrollContainer';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

describe('ScrollContainer Component', () => {
  const createTestItems = (count) => {
    return Array.from({ length: count }, (_, i) => (
      <div key={i} data-testid={`scroll-item-${i}`} className="mg-scroll-item">
        <a href={`#item-${i}`}>Item {i}</a>
      </div>
    ));
  };

  const renderScrollContainer = (props = {}) => {
    const defaultProps = {
      children: createTestItems(10),
      height: '300px',
      minWidth: '100%',
      itemWidth: '250px',
      padding: '16px',
      className: 'test-scroll',
      showArrows: true,
      stepSize: 300
    };

    return render(
      <ScrollContainer {...defaultProps} {...props} />
    );
  };

  // Helper to simulate scroll
  const simulateScroll = (element, scrollLeft) => {
    Object.defineProperty(element, 'scrollLeft', {
      writable: true,
      configurable: true,
      value: scrollLeft
    });

    Object.defineProperty(element, 'scrollWidth', {
      writable: true,
      configurable: true,
      value: 2000 // Arbitrary large value for testing
    });

    Object.defineProperty(element, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 800 // Arbitrary smaller value for testing
    });

    fireEvent.scroll(element);
  };

  // Helper to simulate drag
  const simulateDrag = (element, startX, endX) => {
    fireEvent.mouseDown(element, { pageX: startX });
    fireEvent.mouseMove(element, { pageX: endX });
    fireEvent.mouseUp(element);
  };

  it('renders the scroll container with content', () => {
    renderScrollContainer();
    
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll');
    expect(container).toBeInTheDocument();
    expect(container.querySelector('.mg-scroll__container')).toBeInTheDocument();
    expect(container.querySelector('.mg-scroll__content')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-item-0')).toBeInTheDocument();
  });

  it('shows right arrow when content overflows', () => {
    renderScrollContainer();
    
    // Get container and arrows
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll').querySelector('.mg-scroll__container');
    const leftArrow = screen.getByRole('button', { name: 'Scroll left' });
    const rightArrow = screen.getByRole('button', { name: 'Scroll right' });
    
    // Force the right arrow to be visible for testing
    simulateScroll(container, 0);
    
    expect(leftArrow).toHaveAttribute('disabled');
    expect(rightArrow).not.toHaveAttribute('disabled');
  });

  it('shows both arrows when scrolled to middle', () => {
    renderScrollContainer();
    
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll').querySelector('.mg-scroll__container');
    const leftArrow = screen.getByRole('button', { name: 'Scroll left' });
    const rightArrow = screen.getByRole('button', { name: 'Scroll right' });
    
    // Simulate scroll to middle
    simulateScroll(container, 500);
    
    // Now both arrows should be visible
    expect(leftArrow).not.toHaveAttribute('disabled');
    expect(rightArrow).not.toHaveAttribute('disabled');
  });

  it('hides right arrow when scrolled to end', () => {
    renderScrollContainer();
    
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll').querySelector('.mg-scroll__container');
    const leftArrow = screen.getByRole('button', { name: 'Scroll left' });
    const rightArrow = screen.getByRole('button', { name: 'Scroll right' });
    
    // Simulate scroll to end
    simulateScroll(container, 1200);
    
    // Now only left arrow should be visible
    expect(leftArrow).not.toHaveAttribute('disabled');
    expect(rightArrow).toHaveAttribute('disabled');
  });

  it('scrolls left when left arrow is clicked', () => {
    renderScrollContainer();
    
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll').querySelector('.mg-scroll__container');
    const leftArrow = screen.getByRole('button', { name: 'Scroll left' });
    
    // First scroll to middle to make left arrow visible
    simulateScroll(container, 500);
    
    // Mock scrollTo method
    container.scrollTo = jest.fn();
    
    // Click left arrow
    fireEvent.click(leftArrow);
    
    // Check if scrollTo was called
    expect(container.scrollTo).toHaveBeenCalledWith({
      left: expect.any(Number),
      behavior: 'smooth'
    });
  });

  it('scrolls right when right arrow is clicked', () => {
    renderScrollContainer();
    
    const container = screen.getByRole('button', { name: 'Scroll left' }).closest('.mg-scroll').querySelector('.mg-scroll__container');
    const rightArrow = screen.getByRole('button', { name: 'Scroll right' });
    
    // Force the right arrow to be visible for testing
    simulateScroll(container, 0);
    
    // Mock scrollTo method
    container.scrollTo = jest.fn();
    
    // Click right arrow
    fireEvent.click(rightArrow);
    
    // Check if scrollTo was called
    expect(container.scrollTo).toHaveBeenCalledWith({
      left: expect.any(Number),
      behavior: 'smooth'
    });
  });

  it('does not show arrows when showArrows is false', () => {
    renderScrollContainer({ showArrows: false });
    
    // No arrows should be visible
    expect(screen.queryByRole('button', { name: 'Scroll left' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scroll right' })).not.toBeInTheDocument();
  });
});
