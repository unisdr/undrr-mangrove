import React from 'react';
import createHydrator from '../hydrate';

// Mock react-dom/client
const mockRender = jest.fn();
const mockUnmount = jest.fn();
const mockCreateRoot = jest.fn(() => ({
  render: mockRender,
  unmount: mockUnmount,
}));

jest.mock('react-dom/client', () => ({
  createRoot: (...args) => mockCreateRoot(...args),
}));

function DummyComponent(props) {
  return React.createElement('div', null, props.text);
}

beforeEach(() => {
  document.body.innerHTML = '';
  jest.clearAllMocks();
});

describe('createHydrator', () => {
  it('queries DOM and renders component into each matching container', () => {
    document.body.innerHTML = `
      <div class="target" data-text="hello"></div>
      <div class="target" data-text="world"></div>
    `;

    const fromElement = el => ({ text: el.dataset.text });
    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement,
    });

    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    expect(mockRender).toHaveBeenCalledTimes(2);
    expect(result.roots).toHaveLength(2);
  });

  it('passes extracted props from fromElement to React.createElement', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const fromElement = () => ({ text: 'extracted', count: 42 });
    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement,
    });

    expect(mockRender).toHaveBeenCalledWith(
      React.createElement(DummyComponent, { text: 'extracted', count: 42 })
    );
  });

  it('unwraps module.default when component is a module object', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const moduleObj = { default: DummyComponent, __esModule: true };
    createHydrator({
      selector: '.target',
      component: moduleObj,
      fromElement: () => ({ text: 'test' }),
    });

    expect(mockRender).toHaveBeenCalledWith(
      React.createElement(DummyComponent, { text: 'test' })
    );
  });

  it('catches errors per-container without crashing others', () => {
    document.body.innerHTML = `
      <div class="target" data-id="1"></div>
      <div class="target" data-id="2"></div>
    `;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    let callCount = 0;
    const fromElement = el => {
      callCount++;
      if (callCount === 1) throw new Error('bad element');
      return { text: el.dataset.id };
    };

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement,
    });

    // First container errors, second succeeds
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(result.roots).toHaveLength(1);
    consoleSpy.mockRestore();
  });

  it('restores original innerHTML on error when clearContainer is true', () => {
    document.body.innerHTML =
      '<div class="target"><p>original content</p></div>';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => {
        throw new Error('fail');
      },
    });

    const container = document.querySelector('.target');
    expect(container.innerHTML).toBe('<p>original content</p>');
    consoleSpy.mockRestore();
  });

  it('returns empty roots when no containers match', () => {
    document.body.innerHTML = '<div class="other"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({}),
    });

    expect(result.roots).toHaveLength(0);
    expect(mockCreateRoot).not.toHaveBeenCalled();
  });

  it('unmountAll calls unmount on every root', () => {
    document.body.innerHTML = `
      <div class="target"></div>
      <div class="target"></div>
    `;

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    result.unmountAll();
    expect(mockUnmount).toHaveBeenCalledTimes(2);
  });

  it('unmountAll clears hydration markers and empties roots', () => {
    document.body.innerHTML = `
      <div class="target"></div>
      <div class="target"></div>
    `;

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    result.unmountAll();

    // Markers should be cleared
    document.querySelectorAll('.target').forEach(el => {
      expect(el.dataset.mgHydrated).toBeUndefined();
    });

    // Roots array should be empty
    expect(result.roots).toHaveLength(0);
  });

  it('allows re-mounting after unmountAll', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    result.unmountAll();
    jest.clearAllMocks();

    // Re-scan should mount again since markers were cleared
    result.update();
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(result.roots).toHaveLength(1);
  });

  it('unmountAll is safe to call twice', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    result.unmountAll();
    result.unmountAll();
    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });

  it('calls onError callback when fromElement throws', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const onError = jest.fn();
    const error = new Error('extraction failed');

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => {
        throw error;
      },
      options: { onError },
    });

    expect(onError).toHaveBeenCalledWith(
      error,
      document.querySelector('.target')
    );
    consoleSpy.mockRestore();
  });

  it('does not clear container when clearContainer is false', () => {
    document.body.innerHTML =
      '<div class="target"><p>keep me</p></div>';

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
      options: { clearContainer: false },
    });

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
  });

  it('passes identifierPrefix to createRoot for each container', () => {
    document.body.innerHTML = `
      <div class="target"></div>
      <div class="target"></div>
    `;

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    // Each call should receive an options object with identifierPrefix
    const firstOpts = mockCreateRoot.mock.calls[0][1];
    const secondOpts = mockCreateRoot.mock.calls[1][1];
    expect(firstOpts.identifierPrefix).toMatch(/-0-$/);
    expect(secondOpts.identifierPrefix).toMatch(/-1-$/);
  });

  it('uses custom identifierPrefix from options', () => {
    document.body.innerHTML = '<div class="target"></div>';

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
      options: { identifierPrefix: 'custom' },
    });

    const opts = mockCreateRoot.mock.calls[0][1];
    expect(opts.identifierPrefix).toBe('custom-0-');
  });

  it('passes error callbacks to createRoot', () => {
    document.body.innerHTML = '<div class="target"></div>';

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    const opts = mockCreateRoot.mock.calls[0][1];
    expect(typeof opts.onCaughtError).toBe('function');
    expect(typeof opts.onUncaughtError).toBe('function');
    expect(typeof opts.onRecoverableError).toBe('function');
  });

  it('error callbacks invoke onError with the container', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const onError = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
      options: { onError },
    });

    const opts = mockCreateRoot.mock.calls[0][1];
    const container = document.querySelector('.target');
    const testError = new Error('render error');

    opts.onCaughtError(testError, { componentStack: '' });
    expect(onError).toHaveBeenCalledWith(testError, container);

    onError.mockClear();
    opts.onUncaughtError(testError, { componentStack: '' });
    expect(onError).toHaveBeenCalledWith(testError, container);

    consoleSpy.mockRestore();
  });
});

describe('hydration marker', () => {
  it('sets data-mg-hydrated on successfully mounted containers', () => {
    document.body.innerHTML = '<div class="target"></div>';

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    const container = document.querySelector('.target');
    expect(container.dataset.mgHydrated).toBe('true');
  });

  it('does not set data-mg-hydrated on containers that error', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => {
        throw new Error('fail');
      },
    });

    const container = document.querySelector('.target');
    expect(container.dataset.mgHydrated).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('skips containers that are already hydrated', () => {
    document.body.innerHTML = `
      <div class="target" data-mg-hydrated="true"></div>
      <div class="target"></div>
    `;

    createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    // Only the second container should be mounted
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
  });

  it('prevents double-mounting when createHydrator is called twice', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const config = {
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    };

    createHydrator(config);
    createHydrator(config);

    // Should only mount once despite two calls
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
  });
});

describe('update(context)', () => {
  it('hydrates new containers added after initial mount', () => {
    document.body.innerHTML = '<div class="target" data-text="first"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: el => ({ text: el.dataset.text }),
    });

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);

    // Simulate new DOM (e.g., AJAX, Gutenberg block added)
    const newContainer = document.createElement('div');
    newContainer.className = 'target';
    newContainer.dataset.text = 'second';
    document.body.appendChild(newContainer);

    const newRoots = result.update();

    // Should mount the new container but not re-mount the first
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    expect(newRoots).toHaveLength(1);
    expect(result.roots).toHaveLength(2);
  });

  it('scans only within the provided context element', () => {
    document.body.innerHTML = `
      <div id="existing" class="target"></div>
      <div id="ajax-wrapper">
        <div class="target" data-text="new"></div>
      </div>
    `;

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: el => ({ text: el.dataset.text || 'default' }),
    });

    // Initial: both containers mounted
    expect(mockCreateRoot).toHaveBeenCalledTimes(2);
    jest.clearAllMocks();

    // Add a new container inside #ajax-wrapper
    const ajaxWrapper = document.getElementById('ajax-wrapper');
    const newEl = document.createElement('div');
    newEl.className = 'target';
    newEl.dataset.text = 'ajax-loaded';
    ajaxWrapper.appendChild(newEl);

    // Update with context scoped to #ajax-wrapper
    const newRoots = result.update(ajaxWrapper);

    // Should only mount the new one (the existing one in ajax-wrapper is already hydrated)
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(newRoots).toHaveLength(1);
    expect(result.roots).toHaveLength(3);
  });

  it('returns empty array when no new containers found', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    jest.clearAllMocks();
    const newRoots = result.update();

    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(newRoots).toHaveLength(0);
  });

  it('accumulates roots across multiple update calls', () => {
    document.body.innerHTML = '<div class="target"></div>';

    const result = createHydrator({
      selector: '.target',
      component: DummyComponent,
      fromElement: () => ({ text: 'test' }),
    });

    expect(result.roots).toHaveLength(1);

    // Add two more containers
    for (let i = 0; i < 2; i++) {
      const el = document.createElement('div');
      el.className = 'target';
      document.body.appendChild(el);
    }

    result.update();
    expect(result.roots).toHaveLength(3);

    // unmountAll should cover all accumulated roots
    result.unmountAll();
    expect(mockUnmount).toHaveBeenCalledTimes(3);
  });
});
