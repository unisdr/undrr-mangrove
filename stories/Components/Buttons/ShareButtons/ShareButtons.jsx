import React from 'react';
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import LinkUrls from './links.json';

const defaults = {
  defaultSharingTextBody: 'Check out this link: ',
  defaultSharingTextSubject: 'Sharing Link',
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
}) => {
  const modalRef = useRef(null);
  const [qrCodeCopied, setQrCodeCopied] = useState(false);

  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = e => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset copy state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQrCodeCopied(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await onCopy();
      setQrCodeCopied(true);

      // Auto-dismiss feedback after 2 seconds
      setTimeout(() => {
        setQrCodeCopied(false);
      }, 2000);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Copy failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-vf-google-analytics-region="share-qr-code"
      className="mg-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        ref={modalRef}
        className="mg-modal"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexShrink: 0,
          }}
        >
          <h3>QR code</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#666',
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <p>
          This QR code contains the link below. You can copy the image or add it to your printed or display materials.
        </p>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '8px',
          }}
        >
          {qrCodeDataUrl && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{
                  maxWidth: '100%',
                  maxHeight: '220px',
                  height: 'auto',
                }}
              />
              <div style={{ textAlign: 'left' }}>
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
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {qrCodeCopied ? `${copiedLabel}` : ''}
        </div>

        <div
          style={{
            marginTop: '16px',
            flexShrink: 0,
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              className="mg-button mg-button-primary"
              disabled={qrCodeCopied}
            >
              {qrCodeCopied ? copiedLabel : 'Copy image'}
            </button>
            <button
              onClick={onDownload}
              className="mg-button mg-button-secondary"
            >
              Download image
            </button>
          </div>
          <button
            onClick={onClose}
            className="mg-button mg-button-secondary"
            style={{ marginLeft: 'auto' }}
          >
            Close message
          </button>
        </div>
      </div>
    </div>
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
  labels,
  SharingSubject,
  SharingTextBody,
  // CustomUrl,
  ...props
}) => {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);

  const getLinkToShare = () => {
    const shortlinkElement = document.querySelector('link[rel="shortlink"]');
    return shortlinkElement ? shortlinkElement.href : window.location.href;
  };

  const sharedLink = getLinkToShare();

  const getShareableLinkForPlatform = Platform => {
    let baseLink = LinkUrls[Platform];
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

      // console.log('Generating QR code for URL:', qrCodeUrl);

      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 1024,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(dataUrl);
      setQrModalOpen(true);

      // console.log('QR code generated successfully');
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

        // console.log('QR code copied to clipboard successfully');
        // Visual feedback is now handled in the QRCodeModal component
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

        // console.log('QR code downloaded successfully as:', filename);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const closeQRModal = () => {
    setQrModalOpen(false);
    if (qrCodeDataUrl) {
      URL.revokeObjectURL(qrCodeDataUrl);
      setQrCodeDataUrl(null);
    }
  };

  return (
    <>
      <section
        data-vf-google-analytics-region="share-this"
        className="mg-share"
        {...props}
      >
        <header className="mg-share__header">{labels.mainLabel}</header>
        <div className="mg-share__buttons">
          {navigator.share && (
            <button
              data-vf-analytics-label="Social share: Web Share API"
              onClick={() => handleClick('WebShare')}
              aria-label="Share using your device"
              title="Share using your device"
              className="mg-share__button"
            >
              <span className="mg-icon fa-share" aria-hidden="true"></span>
            </button>
          )}
          <button
            data-vf-analytics-label="Social share: LinkedIn"
            onClick={() => handleClick('LinkedIn')}
            aria-label="Share on LinkedIn"
            className="mg-share__button"
            title="Share on LinkedIn"
          >
            <span className="mg-icon fa-linkedin" aria-hidden="true"></span>
          </button>
          <button
            data-vf-analytics-label="Social share: Facebook"
            onClick={() => handleClick('Facebook')}
            aria-label="Share on Facebook"
            title="Share on Facebook"
            className="mg-share__button"
          >
            <span className="mg-icon fa-facebook" aria-hidden="true"></span>
          </button>
          <button
            data-vf-analytics-label="Social share: X"
            onClick={() => handleClick('Twitter')}
            aria-label="Share on X"
            className="mg-share__button"
            title="Share on X"
          >
            <span className="mg-icon fa-x-social" aria-hidden="true"></span>
          </button>
          <button
            data-vf-analytics-label="Social share: Mail"
            onClick={() => handleClick('Mail')}
            aria-label="Share via Email"
            className="mg-share__button"
            title="Share via Email"
          >
            <span className="mg-icon fa-envelope" aria-hidden="true"></span>
          </button>
          <button
            data-vf-analytics-label="Social share: QR Code"
            onClick={() => handleClick('QRCode')}
            aria-label="Generate QR Code"
            className="mg-share__button"
            title="Generate QR Code"
          >
            <span className="mg-icon fa-qrcode" aria-hidden="true"></span>
          </button>
        </div>

        <CopyButton
          className="mg-share__copy-button"
          copiedLabel={labels.onCopy}
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
        copiedLabel={labels.onCopy}
      />
    </>
  );
};

/**
 *  CopyButton
 *  @param {string} copiedLabel - the label that will be shown when the link is coppied(should be in the right language)
 *  @param {string} sharedLink - the link that will be copied
 */
export function CopyButton({ copiedLabel, sharedLink, className }) {
  const [coppied, setCoppied] = useState(false);
  const [visibleLink, setVisibleLink] = useState(sharedLink);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCoppied(true);
  };

  //on sharedLink change, update visibleLink to not show http/s
  useEffect(() => {
    let newVisibleLink = sharedLink;
    //replace https only if it is in the beginning of the URL
    if (sharedLink.startsWith('https://')) {
      //replace replaces only first occurence
      newVisibleLink = sharedLink.replace('https://', '');
    } else if (sharedLink.startsWith('http://')) {
      newVisibleLink = sharedLink.replace('http://', '');
    }
    setVisibleLink(newVisibleLink);
  }, [sharedLink]);

  return (
    <button
      data-vf-analytics-label="Quick link copy"
      aria-label="Copy to Clipboard"
      title="Copy to Clipboard"
      className={className}
      onClick={() => handleCopyLink()}
    >
      <div className="mg-share__clip-icon">
        <span className="mg-icon fa-link" aria-hidden="true"></span>
      </div>
      <div className="mg-share__copy-text">
        {coppied ? copiedLabel : visibleLink}
      </div>
      <div className="mg-share__stack-icon">
        <span className="mg-icon fa-clone" alt="Copy icon"></span>
      </div>
    </button>
  );
}

export default ShareButtons;
