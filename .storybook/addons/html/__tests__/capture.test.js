import { observeHtml, readHtml } from '../capture';

const tick = async () => {
  await jest.advanceTimersByTimeAsync(80);
};

describe('live HTML capture', () => {
  let canvas;
  beforeEach(() => {
    jest.useFakeTimers();
    canvas = document.createElement('div');
    canvas.innerHTML = '<p><strong>Risk</strong>, then act.</p>';
    document.body.append(canvas);
  });
  afterEach(() => {
    canvas.remove();
    jest.useRealTimers();
  });

  it('removes comment nodes without changing content or live IDs', () => {
    canvas.innerHTML =
      '<!-- marker --><label for="live-id">Name</label><input id="live-id"><script type="application/json">"<!-- content -->"</script>';
    const html = readHtml(canvas);
    expect(html).not.toContain('<!-- marker -->');
    expect(html).toContain('"<!-- content -->"');
    expect(html).toContain('for="live-id"');
    expect(canvas.innerHTML).toContain('<!-- marker -->');
    expect(readHtml(canvas, { removeComments: false })).toContain(
      '<!-- marker -->'
    );
  });

  it('keeps custom root lookup inside this canvas and reports a missing root', () => {
    expect(readHtml(canvas, { root: 'p' })).toBe(
      '<strong>Risk</strong>, then act.'
    );
    expect(() => readHtml(canvas, { root: 'body' })).toThrow(
      'HTML root not found'
    );
  });

  it('captures interaction mutations and cancels formatting after disposal', async () => {
    const publish = jest.fn();
    let finish;
    const formatHtml = jest.fn(
      code =>
        new Promise(resolve => {
          finish = () => resolve(code);
        })
    );
    const stop = observeHtml(canvas, {}, publish, async () => ({ formatHtml }));
    await tick();
    const older = finish;
    canvas.querySelector('p').textContent = 'Updated asynchronously';
    await Promise.resolve();
    await tick();
    older();
    await Promise.resolve();
    expect(
      publish.mock.calls.some(([result]) => result.status === 'ready')
    ).toBe(false);
    finish();
    await tick();
    expect(publish).toHaveBeenLastCalledWith({
      status: 'ready',
      code: '<p>Updated asynchronously</p>',
    });
    canvas.setAttribute('dir', 'rtl');
    await Promise.resolve();
    await tick();
    stop();
    const calls = publish.mock.calls.length;
    finish();
    canvas.textContent = 'After teardown';
    await tick();
    expect(publish).toHaveBeenCalledTimes(calls);
  });

  it('keeps raw HTML copyable if lazy formatting fails', async () => {
    const publish = jest.fn();
    const stop = observeHtml(canvas, {}, publish, async () => {
      throw new Error('chunk failed');
    });
    await tick();
    expect(publish).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'ready',
        code: canvas.innerHTML,
        warning: expect.stringContaining('unformatted'),
      })
    );
    stop();
  });

  it('clears output instead of retaining another root when the selector fails', async () => {
    const publish = jest.fn();
    const load = jest.fn();
    const stop = observeHtml(canvas, { root: '.missing' }, publish, load);
    await tick();
    expect(publish).toHaveBeenLastCalledWith({
      status: 'error',
      code: '',
      warning: 'HTML root not found: .missing',
    });
    expect(load).not.toHaveBeenCalled();
    stop();
  });
});
