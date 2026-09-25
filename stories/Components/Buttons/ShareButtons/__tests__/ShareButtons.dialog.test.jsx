import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import QRCode from 'qrcode';
import ShareButtons from '../ShareButtons';

jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

beforeEach(() => {
  QRCode.toDataURL.mockResolvedValue('data:image/png;base64,AAAA');
});

async function openDialog() {
  const trigger = screen.getByRole('button', { name: 'Generate QR Code' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'QR code' });
  return { trigger, dialog };
}

describe('ShareButtons QR dialog', () => {
  it('opens as a labelled modal and restores focus after Close', async () => {
    render(<ShareButtons />);
    const { trigger, dialog } = await openDialog();

    expect(dialog).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(dialog).toHaveTextContent('utm_source=qr');
    expect(dialog).toHaveTextContent('utm_medium=web');
    expect(dialog).toHaveTextContent('utm_campaign=share_box');

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    expect(closeButton).toHaveClass('mg-icon-button', 'mg-share__dialog-close');
    expect(closeButton.querySelector('.mg-icon-close')).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    fireEvent.click(closeButton);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on native cancel and keeps translated labels', async () => {
    render(
      <ShareButtons
        labels={{
          generateQRCode: 'Créer un code QR',
          qrCodeTitle: 'Code QR',
          closeModal: 'Fermer la fenêtre',
          copyImage: 'Copier l’image',
          downloadImage: 'Télécharger l’image',
        }}
      />
    );
    const trigger = screen.getByRole('button', { name: 'Créer un code QR' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Code QR' });
    expect(
      screen.getByRole('button', { name: 'Copier l’image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Télécharger l’image' })
    ).toBeInTheDocument();

    dialog.close();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(trigger).toHaveFocus();
  });

  it('keeps QR copy and download actions working', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      blob: async () => blob,
    });
    const clipboardWrite = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { write: clipboardWrite },
    });
    global.ClipboardItem = jest.fn().mockImplementation(items => items);
    URL.createObjectURL = jest.fn().mockReturnValue('blob:qr-code');
    URL.revokeObjectURL = jest.fn();
    const linkClick = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(<ShareButtons />);
    const { dialog } = await openDialog();
    expect(dialog.querySelector('img')).toHaveAttribute(
      'src',
      'data:image/png;base64,AAAA'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy image' }));
    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Download image' }));
    await waitFor(() => expect(linkClick).toHaveBeenCalledTimes(1));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:qr-code');
    expect(global.fetch).toHaveBeenCalledWith('data:image/png;base64,AAAA');
    linkClick.mockRestore();
    global.fetch = originalFetch;
  });

  it('has no accessibility violations while open', async () => {
    const { container } = render(<ShareButtons />);
    await openDialog();
    expect(await axe(container)).toHaveNoViolations();
  });
});
