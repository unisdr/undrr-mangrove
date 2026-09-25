import React from 'react';
import { useState, useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import LinkUrls from './links.json';

const defaults = {
  defaultSharingTextBody: 'Check out this link: ',
  defaultSharingTextSubject: 'Sharing Link',
};

export const DEFAULT_SHARE_LABELS = {
  mainLabel: 'Share this',
  onCopy: 'Copied',
  qrCodeTitle: 'QR code',
  qrCodeDescription:
    'This QR code contains the link below. You can copy the image or add it to your printed or display materials.',
  closeModal: 'Close modal',
  copyImage: 'Copy image',
  downloadImage: 'Download image',
  closeMessage: 'Close message',
  shareUsingDevice: 'Share using your device',
  shareOnLinkedIn: 'Share on LinkedIn',
  shareOnFacebook: 'Share on Facebook',
  shareOnX: 'Share on X',
  shareViaEmail: 'Share via Email',
  generateQRCode: 'Generate QR Code',
  copyToClipboard: 'Copy to Clipboard',
};

/**
 * QR Code Modal Component
 */
const QRCodeModal = ({
  isOpen,
  onClose,
  qrCodeDataUrl,
  onCopy,
  onDownload,
  sharedLink,
  copiedLabel = 'Image copied',
  titleLabel = 'QR code',
  descriptionLabel = 'This QR code contains the link below. You can copy the image or add it to your printed or display materials.',
  closeModalLabel = 'Close modal',
  copyImageLabel = 'Copy image',
  downloadImageLabel = 'Download image',
  closeMessageLabel = 'Close message',
}) => {
  const modalRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [qrCodeCopied, setQrCodeCopied] = useState(false);

  // Reset the "copied" confirmation when the modal reopens. Tracking the
  // previous isOpen in a ref lets us detect the false→true transition during
  // render — no extra useEffect round-trip needed.
  const prevIsOpenRef = useRef(isOpen);
  if (isOpen !== prevIsOpenRef.current) {
    prevIsOpenRef.current = isOpen;
    if (isOpen) {
      setQrCodeCopied(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = modalRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!qrCodeCopied) return undefined;
    const timeout = setTimeout(() => setQrCodeCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [qrCodeCopied]);

  const handleCopy = async () => {
    try {
      await onCopy();
      setQrCodeCopied(true);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Copy failed:', error);
    }
  };

  if (!isOpen) return null;

  const closeDialog = () => modalRef.current?.close();

  const handleBackdropClick = event => {
    if (event.target !== modalRef.current) return;
    const rect = modalRef.current.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      closeDialog();
    }
  };

  return (
    <dialog
      ref={modalRef}
      data-vf-google-analytics-region="share-qr-code"
      className="mg-share__dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="mg-share__dialog-header">
        <h2 id={titleId} className="mg-share__dialog-title">
          {titleLabel}
        </h2>
        <button
          type="button"
          onClick={closeDialog}
          className="mg-icon-button mg-share__dialog-close"
          aria-label={closeModalLabel}
        >
          <span className="mg-icon mg-icon-close" aria-hidden="true" />
        </button>
      </div>
      <p id={descriptionId} className="mg-share__dialog-description">
        {descriptionLabel}
      </p>
      <div className="mg-share__dialog-content">
        {qrCodeDataUrl && (
          <div>
            <img
              src={qrCodeDataUrl}
              alt=""
              className="mg-share__dialog-image"
            />
            <div className="mg-share__dialog-url">
              <code className="mg-code--block">
                {(() => {
                  const url = new URL(sharedLink);
                  url.searchParams.set('utm_source', 'qr');
                  url.searchParams.set('utm_medium', 'web');
                  url.searchParams.set('utm_campaign', 'share_box');
                  return url.toString();
                })()}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Accessibility announcement for copy feedback */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="mg-share__visually-hidden"
      >
        {qrCodeCopied ? `${copiedLabel}` : ''}
      </div>

      <div className="mg-share__dialog-actions">
        <div className="mg-share__dialog-actions-primary">
          <button
            type="button"
            onClick={handleCopy}
            className="mg-button mg-button-primary"
            disabled={qrCodeCopied}
          >
            {qrCodeCopied ? copiedLabel : copyImageLabel}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="mg-button mg-button-secondary"
          >
            {downloadImageLabel}
          </button>
        </div>
        <button
          type="button"
          onClick={closeDialog}
          className="mg-button mg-button-secondary"
        >
          {closeMessageLabel}
        </button>
      </div>
    </dialog>
  );
};

/**
 *  ShareButtons is a Component that renders buttons to share on platforms like twitter, facebook, linkedin and others
 *  @param {Object} labels - should contain language specific values like:
 *                           mainLabel: "SHARE THIS "
 *                           onCopy: "Copied"
 *  @param {string} SharingSubject - subject of the Email that will be prefilled to the user
 *  @param {string} SharingTextBody - body of the Email that will be prefilled and appended with LINK to the site
 */
const ShareButtons = ({
  labels = {},
  SharingSubject,
  SharingTextBody,
  // CustomUrl,
  ...props
}) => {
  const l = { ...DEFAULT_SHARE_LABELS, ...labels };
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const qrButtonRef = useRef(null);

  const getLinkToShare = () => {
    const shortlinkElement = document.querySelector('link[rel="shortlink"]');
    return shortlinkElement ? shortlinkElement.href : window.location.href;
  };

  const sharedLink = getLinkToShare();

  const getShareableLinkForPlatform = Platform => {
    const baseLink = LinkUrls[Platform];
    const subject = encodeURIComponent(
      SharingSubject ?? defaults.defaultSharingTextSubject
    );
    const body =
      encodeURIComponent(SharingTextBody ?? defaults.defaultSharingTextBody) +
      encodeURIComponent(sharedLink);

    return baseLink
      .replace('[SHARING_TEXT_SUBJECT]', subject)
      .replace('[SHARING_TEXT_BODY]', body);
  };

  const handleClick = Platform => {
    if (Platform === 'QRCode') {
      generateQRCode();
    } else if (Platform === 'WebShare' && navigator.share) {
      // Use the Web Share API
      navigator
        .share({
          title: SharingSubject ?? defaults.defaultSharingTextSubject,
          text: SharingTextBody ?? defaults.defaultSharingTextBody,
          url: sharedLink,
        })
        .catch(error => console.error('Error sharing', error));
    } else {
      // Fallback to the existing behavior
      var executableLink = getShareableLinkForPlatform(Platform);

      if (Platform === 'Mail') {
        window.location.href = executableLink; // Opens the default email client
      } else {
        window.open(executableLink, '_blank', 'width=600,height=300');
      }
    }
  };

  const generateQRCode = async () => {
    try {
      // Build URL with UTM parameters, properly handling existing query params
      const url = new URL(sharedLink);
      url.searchParams.set('utm_source', 'qr');
      url.searchParams.set('utm_medium', 'web');
      url.searchParams.set('utm_campaign', 'share_box');
      const qrCodeUrl = url.toString();

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 1024,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodeDataUrl(dataUrl);
      setQrModalOpen(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  const copyQRCodeToClipboard = async () => {
    try {
      if (qrCodeDataUrl) {
        // Convert data URL back to blob
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();

        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
      }
    } catch (error) {
      console.error('Error copying QR code to clipboard:', error);
      alert(
        'Failed to copy QR code to clipboard. Please check browser permissions.'
      );
    }
  };

  const downloadQRCode = async () => {
    try {
      if (qrCodeDataUrl) {
        // Convert data URL back to blob
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();

        // Create a filename from the URL
        const url = new URL(sharedLink);
        let filename = 'qr-code';

        // Add domain name if available
        if (url.hostname) {
          const domain = url.hostname.replace(/^www\./, '').replace(/\./g, '-');
          filename += `-${domain}`;
        }

        // Add path if it's not just the root
        if (url.pathname && url.pathname !== '/') {
          const path = url.pathname
            .replace(/^\//, '') // Remove leading slash
            .replace(/\/$/, '') // Remove trailing slash
            .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

          if (path) {
            filename += `-${path}`;
          }
        }

        // Limit filename length and add extension
        filename = filename.substring(0, 100) + '.png';

        // Create a download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const closeQRModal = () => {
    setQrModalOpen(false);
    setQrCodeDataUrl(null);
    qrButtonRef.current?.focus();
  };

  return (
    <>
      <section
        data-vf-google-analytics-region="share-this"
        className="mg-share"
        {...props}
      >
        <header className="mg-share__header">{l.mainLabel}</header>
        <div className="mg-share__buttons">
          {navigator.share && (
            <button
              data-vf-analytics-label="Social share: Web Share API"
              onClick={() => handleClick('WebShare')}
              aria-label={l.shareUsingDevice}
              title={l.shareUsingDevice}
              className="mg-share__button"
            >
              <span className="mg-icon mg-icon-share" aria-hidden="true"></span>
            </button>
          )}
          <button
            data-vf-analytics-label="Social share: LinkedIn"
            onClick={() => handleClick('LinkedIn')}
            aria-label={l.shareOnLinkedIn}
            className="mg-share__button"
            title={l.shareOnLinkedIn}
          >
            <span
              className="mg-icon mg-icon-linkedin"
              aria-hidden="true"
            ></span>
          </button>
          <button
            data-vf-analytics-label="Social share: Facebook"
            onClick={() => handleClick('Facebook')}
            aria-label={l.shareOnFacebook}
            title={l.shareOnFacebook}
            className="mg-share__button"
          >
            <span
              className="mg-icon mg-icon-facebook"
              aria-hidden="true"
            ></span>
          </button>
          <button
            data-vf-analytics-label="Social share: X"
            onClick={() => handleClick('Twitter')}
            aria-label={l.shareOnX}
            className="mg-share__button"
            title={l.shareOnX}
          >
            <span
              className="mg-icon mg-icon-x-social"
              aria-hidden="true"
            ></span>
          </button>
          <button
            data-vf-analytics-label="Social share: Mail"
            onClick={() => handleClick('Mail')}
            aria-label={l.shareViaEmail}
            className="mg-share__button"
            title={l.shareViaEmail}
          >
            <span
              className="mg-icon mg-icon-envelope"
              aria-hidden="true"
            ></span>
          </button>
          <button
            ref={qrButtonRef}
            data-vf-analytics-label="Social share: QR Code"
            onClick={() => handleClick('QRCode')}
            aria-label={l.generateQRCode}
            className="mg-share__button"
            title={l.generateQRCode}
          >
            <span className="mg-icon mg-icon-qrcode" aria-hidden="true"></span>
          </button>
        </div>

        <CopyButton
          className="mg-share__copy-button"
          copiedLabel={l.onCopy}
          copyToClipboardLabel={l.copyToClipboard}
          sharedLink={sharedLink}
        />
      </section>

      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={closeQRModal}
        qrCodeDataUrl={qrCodeDataUrl}
        onCopy={copyQRCodeToClipboard}
        onDownload={downloadQRCode}
        sharedLink={sharedLink}
        copiedLabel={l.onCopy}
        titleLabel={l.qrCodeTitle}
        descriptionLabel={l.qrCodeDescription}
        closeModalLabel={l.closeModal}
        copyImageLabel={l.copyImage}
        downloadImageLabel={l.downloadImage}
        closeMessageLabel={l.closeMessage}
      />
    </>
  );
};

/**
 *  CopyButton
 *  @param {string} copiedLabel - the label that will be shown when the link is coppied(should be in the right language)
 *  @param {string} sharedLink - the link that will be copied
 */
export function CopyButton({
  copiedLabel,
  sharedLink,
  className,
  copyToClipboardLabel = 'Copy to Clipboard',
}) {
  const [coppied, setCoppied] = useState(false);

  // visibleLink is fully derived from sharedLink: strip the leading http(s)://
  // for display. Computed during render so we don't need useState/useEffect.
  let visibleLink = sharedLink;
  if (sharedLink.startsWith('https://')) {
    visibleLink = sharedLink.replace('https://', '');
  } else if (sharedLink.startsWith('http://')) {
    visibleLink = sharedLink.replace('http://', '');
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCoppied(true);
  };

  return (
    <button
      data-vf-analytics-label="Quick link copy"
      aria-label={copyToClipboardLabel}
      title={copyToClipboardLabel}
      className={className}
      onClick={() => handleCopyLink()}
    >
      <div className="mg-share__clip-icon">
        <span className="mg-icon mg-icon-link" aria-hidden="true"></span>
      </div>
      <div className="mg-share__copy-text">
        {coppied ? copiedLabel : visibleLink}
      </div>
      <div className="mg-share__stack-icon">
        <span className="mg-icon mg-icon-clone" aria-hidden="true"></span>
      </div>
    </button>
  );
}

QRCodeModal.propTypes = {
  /** Controls modal visibility. */
  isOpen: PropTypes.bool.isRequired,
  /** Called when the user closes the modal (Escape, click-outside, or close button). */
  onClose: PropTypes.func.isRequired,
  /** Data URL for the generated QR code image. */
  qrCodeDataUrl: PropTypes.string,
  /** Called when the user copies the QR image to the clipboard. Should return a Promise. */
  onCopy: PropTypes.func.isRequired,
  /** Called when the user downloads the QR image. */
  onDownload: PropTypes.func.isRequired,
  /** URL the QR code encodes (also shown in the modal caption). */
  sharedLink: PropTypes.string.isRequired,
  /** Localised confirmation text shown after a successful copy. */
  copiedLabel: PropTypes.string,
};

ShareButtons.propTypes = {
  /** Translated labels. All keys are optional — unspecified keys fall back to
   * the English defaults in DEFAULT_SHARE_LABELS. */
  labels: PropTypes.shape({
    mainLabel: PropTypes.string,
    onCopy: PropTypes.string,
    qrCodeTitle: PropTypes.string,
    qrCodeDescription: PropTypes.string,
    closeModal: PropTypes.string,
    copyImage: PropTypes.string,
    downloadImage: PropTypes.string,
    closeMessage: PropTypes.string,
    shareUsingDevice: PropTypes.string,
    shareOnLinkedIn: PropTypes.string,
    shareOnFacebook: PropTypes.string,
    shareOnX: PropTypes.string,
    shareViaEmail: PropTypes.string,
    generateQRCode: PropTypes.string,
    copyToClipboard: PropTypes.string,
  }),
  /** Subject line used for email share and the QR caption. */
  SharingSubject: PropTypes.string,
  /** Body text prefixed to the shared URL in email and clipboard payloads. */
  SharingTextBody: PropTypes.string,
};

CopyButton.propTypes = {
  /** Localised confirmation text shown after a successful copy. */
  copiedLabel: PropTypes.string.isRequired,
  /** URL to copy; also rendered (with `http(s)://` stripped) as the button label. */
  sharedLink: PropTypes.string.isRequired,
  /** Optional CSS class applied to the root button element. */
  className: PropTypes.string,
  /** Accessible label for the copy button. */
  copyToClipboardLabel: PropTypes.string,
};

export default ShareButtons;
