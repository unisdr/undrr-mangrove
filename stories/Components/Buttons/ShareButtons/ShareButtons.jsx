import React from "react";
import { useState, useEffect } from "react";
import LinkUrls from "./links.json"

const defaults = {
  defaultSharingTextBody: "Check out this link: ",
  defaultSharingTextSubject: "Sharing Link",
}

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
  }

  const sharedLink = getLinkToShare();

  const getShareableLinkForPlatform = (Platform) => {
    let baseLink = LinkUrls[Platform];
    const subject = encodeURIComponent(SharingSubject ?? defaults.defaultSharingTextSubject);
    const body = encodeURIComponent(SharingTextBody ?? defaults.defaultSharingTextBody) + encodeURIComponent(sharedLink);

    return baseLink.replace("[SHARING_TEXT_SUBJECT]", subject).replace("[SHARING_TEXT_BODY]", body);
  }

  const handleClick = (Platform) => {
    if (Platform === "WebShare" && navigator.share) {
      // Use the Web Share API
      navigator.share({
        title: SharingSubject ?? defaults.defaultSharingTextSubject,
        text: SharingTextBody ?? defaults.defaultSharingTextBody,
        url: sharedLink,
      }).catch((error) => console.error('Error sharing', error));
    } else {
      // Fallback to the existing behavior
      var executableLink = getShareableLinkForPlatform(Platform);

      if (Platform === "Mail") {
        window.location.href = executableLink; // Opens the default email client
      } else {
        window.open(executableLink, '_blank', 'width=600,height=300');
      }
    }
  };

  return (
    <section data-vf-google-analytics-region="share-this" className="mg-share"  {...props}>
      <header className="mg-share__header">{labels.mainLabel}</header>
      <div className='mg-share__buttons'>
        {navigator.share && (
          <button
            data-vf-analytics-label="Social share: Web Share API"
            onClick={() => handleClick("WebShare")}
            aria-label='Share using your device'
            title='Share using your device'
            className='mg-share__button'>
            <span class="mg-icon fa-share" aria-hidden="true"></span>
          </button>
        )}
        <button
          data-vf-analytics-label="Social share: LinkedIn"
          onClick={() => handleClick("LinkedIn")}
          aria-label='Share on LinkedIn'
          className='mg-share__button'
          title='Share on LinkedIn'  >
          <span class="mg-icon fa-linkedin" aria-hidden="true"></span>
        </button>
        <button
          data-vf-analytics-label="Social share: Facebook"
          onClick={() => handleClick("Facebook")}
          aria-label='Share on Facebook'
          title='Share on Facebook'
          className='mg-share__button' >
          <span class="mg-icon fa-facebook" aria-hidden="true"></span>
        </button>
        <button
          data-vf-analytics-label="Social share: X"
          onClick={() => handleClick("Twitter")}
          aria-label='Share on X'
          className='mg-share__button'
          title='Share on X' >
          <span class="mg-icon fa-x-social" aria-hidden="true"></span>
        </button>
        <button
          data-vf-analytics-label="Social share: Mail"
          onClick={() => handleClick("Mail")}
          aria-label='Share via Email'
          className='mg-share__button'
          title='Share via Email'  >
          <span class="mg-icon fa-envelope" aria-hidden="true"></span>
        </button>
      </div>

      <CopyButton className='mg-share__copy-button' copiedLabel={labels.onCopy} sharedLink={sharedLink} />
    </section>
  );
}

/**
*  CopyButton
*  @param {string} copiedLabel - the label that will be shown when the link is coppied(should be in the right language)
*  @param {string} sharedLink - the link that will be coppied
*/
export function CopyButton({ copiedLabel, sharedLink,  className }) {
  const [coppied, setCoppied] = useState(false);
  const [ visibleLink, setVisibleLink ] = useState(sharedLink);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCoppied(true);
  }

  //on sharedLink change, update visibleLink to not show http/s
  useEffect(() => {
    let newVisibleLink = sharedLink;
    //replace https only if it is in the beginning of the URL
    if (sharedLink.startsWith("https://")) {
      //replace replaces only first occurence
      newVisibleLink = sharedLink.replace("https://", "");
    } else if (sharedLink.startsWith("http://")) {
      newVisibleLink = sharedLink.replace("http://", "");
    }
    setVisibleLink(newVisibleLink);
  }, [sharedLink])

  return (
    <button data-vf-analytics-label="Quick link copy" aria-label='Copy to Clipboard' title='Copy to Clipboard' className={className} onClick={() => handleCopyLink()}>
      <div className='mg-share__clip-icon'>
        <span class="mg-icon fa-link" aria-hidden="true"></span>
      </div>
      <div className='mg-share__copy-text'>{coppied ? copiedLabel : visibleLink}</div>
      <div className='mg-share__stack-icon'>
        <span class="mg-icon fa-clone" alt="Copy icon"></span>
      </div>
    </button>)
}

export default ShareButtons;