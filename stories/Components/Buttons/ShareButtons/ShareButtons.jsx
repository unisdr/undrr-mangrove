import React from 'react';
import { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import LinkUrls from './links.json';

const defaults = {
  defaultSharingTextBody: 'Check out this link: ',
  defaultSharingTextSubject: 'Sharing Link',
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
      generateAndCopyQRCode();
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

  const generateAndCopyQRCode = async () => {
    try {
      // Build URL with UTM parameters, properly handling existing query params
      const url = new URL(sharedLink);
      url.searchParams.set('utm_source', 'qr');
      url.searchParams.set('utm_medium', 'web');
      url.searchParams.set('utm_campaign', 'share_box');
      const qrCodeUrl = url.toString();
      
      console.log('Generating QR code for URL:', qrCodeUrl);
      
      const qrCode = new QRCodeStyling({
        width: 256,
        height: 256,
        type: 'png',
        data: qrCodeUrl,
        dotsOptions: {
          color: '#000000',
          type: 'rounded'
        },
        backgroundOptions: {
          color: '#FFFFFF',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 10
        }
      });

      const blob = await qrCode.getRawData('png');
      
      if (!blob) {
        throw new Error('Failed to generate QR code blob');
      }
      
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      
      console.log('QR code copied to clipboard successfully');
      // TODO: Add visual feedback here similar to CopyButton
    } catch (error) {
      console.error('Error generating or copying QR code:', error);
      alert('Failed to copy QR code to clipboard. Please check browser permissions.');
    }
  };

  return (
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
          aria-label="Copy QR Code"
          className="mg-share__button"
          title="Copy QR Code"
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
  );
};

/**
 *  CopyButton
 *  @param {string} copiedLabel - the label that will be shown when the link is coppied(should be in the right language)
 *  @param {string} sharedLink - the link that will be coppied
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
