import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CopyButton } from '../CopyButton';
import copyButtonFromElement from '../CopyButton.fromElement';
import { mgCopyButton } from '../../../../assets/js/copy-button';

describe('CopyButton Red-Team Security & Stress Regressions', () => {
  let writeTextMock;

  beforeEach(() => {
    jest.useFakeTimers();
    writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('handles rapid sequential clicks without timer drift or memory leaks', async () => {
    render(<CopyButton textToCopy="https://undrr.org" />);
    const btn = screen.getByRole('button');

    // Rapid spam clicks wrapped in act
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        fireEvent.click(btn);
      }
    });

    expect(writeTextMock).toHaveBeenCalledTimes(10);
    expect(btn).toHaveClass('mg-copy-button--copied');

    // Advance partially
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(btn).toHaveClass('mg-copy-button--copied');

    // Click again to restart timer
    await act(async () => {
      fireEvent.click(btn);
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(btn).toHaveClass('mg-copy-button--copied');

    // Complete timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(btn).not.toHaveClass('mg-copy-button--copied');
  });

  it('handles clipboard API rejection gracefully without throwing unhandled exceptions', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    writeTextMock.mockRejectedValueOnce(
      new DOMException('Permission denied by user', 'NotAllowedError')
    );

    render(<CopyButton textToCopy="https://undrr.org" />);
    const btn = screen.getByRole('button');

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Visual copied state should not be applied on failed copy
    expect(btn).not.toHaveClass('mg-copy-button--copied');
    // The reader is told the copy failed and what to do instead
    expect(
      screen.getByText('Copy failed. Select the text and copy it manually.')
    ).toBeInTheDocument();
    expect(btn.querySelector('.mg-copy-button__feedback')).toHaveClass(
      'mg-copy-button__feedback--error'
    );
  });

  it('handles component unmount during active feedback countdown safely', async () => {
    function Wrapper() {
      const [show, setShow] = useState(true);
      return (
        <div>
          {show && <CopyButton textToCopy="test" />}
          <button type="button" onClick={() => setShow(false)}>
            Unmount
          </button>
        </div>
      );
    }

    render(<Wrapper />);
    const copyBtn = screen.getByLabelText('Copy to clipboard');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    // Unmount before timeout expires
    fireEvent.click(screen.getByText('Unmount'));

    // Advance timer past the 2000ms threshold
    expect(() => {
      act(() => {
        jest.advanceTimersByTime(2500);
      });
    }).not.toThrow();
  });

  it('handles malicious / malformed JSON in fromElement safely', () => {
    const el = document.createElement('div');
    el.setAttribute('data-mg-copy-button', '');
    el.setAttribute('data-labels', '{"invalid_json": syntax error');
    el.setAttribute('data-text-to-copy', '<script>alert("xss")</script>');

    expect(() => {
      const props = copyButtonFromElement(el);
      expect(props.textToCopy).toBe('<script>alert("xss")</script>');
    }).not.toThrow();
  });

  it('survives missing navigator.clipboard in standalone vanilla script', async () => {
    delete navigator.clipboard;
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    document.execCommand = jest.fn().mockImplementation(() => {
      throw new Error('execCommand disabled');
    });

    const btn = document.createElement('button');
    btn.setAttribute('data-mg-copy-button', '');
    btn.setAttribute('data-text-to-copy', 'fallback');
    document.body.appendChild(btn);

    const live = document.createElement('span');
    live.className = 'mg-u-sr-only';
    btn.appendChild(live);

    mgCopyButton(btn);
    btn.click();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(live.textContent).toBe(
      'Copy failed. Select the text and copy it manually.'
    );
    document.body.removeChild(btn);
  });
});
