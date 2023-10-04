import React from 'react';
// import './share-buttons.scss';
import FacebookIconWhite from './FacebookIconWhite.svg';
import TwitterIconWhite from './TwitterIconWhite.svg';
import LinkedInIconWhite from './LinkedInIconWhite.svg';
import MailIconWhite from './MailIconWhite.svg';
import CopyIcon from './CopyIcon.svg';
import CheckIcon from './CheckIcon.svg';
import LinkIcon from './LinkIcon.svg';
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
export function ShareButtons({
  labels,
  SharingSubject,
  SharingTextBody,
  // CustomUrl,
  ...props
}) {


  /**
   * for now it is getting the local url and not the Custom link
   * TODO: getting the link that is shared- if not provided, get location href
   *  let SharedLink = CustomLink
   *  if ( CutomLink === '' || CutomLink === undefined || CutomLink === null) {
   *    SharedLink = window.location.href;
   *  }
   *  else {
   *    SharedLink = CutomLink;
   *  }
   * return SharedLink;
   *
 **/
  const getLinkToShare = () => {
    return window.location.href;
  }


  const sharedLink = getLinkToShare()

  /**
   * Function that returns Encoded URL with the prefilled Values from the links.json
   *  @param {string} Platform - Platform that will determine the link url from links Json
   * @returns string executeLink - example: https://twitter.com/intent/tweet?text=Look%20at%20this%3A%20http%3A%2F%2Flocalhost%3A6006%2Fiframe.html%3FviewMode%3Dstory%26id%3Dcomponents-buttons-sharebuttons--share-buttons%26args%3D
 **/
  const getShareableLinkForPlatform = (Platform) => {
    let baseLink = LinkUrls[Platform];
    const subject = encodeURIComponent(SharingSubject ?? defaults.defaultSharingTextSubject);
    const body = encodeURIComponent(SharingTextBody ?? defaults.defaultSharingTextBody) + encodeURIComponent(sharedLink);

    return baseLink.replace("[SHARING_TEXT_SUBJECT]", subject).replace("[SHARING_TEXT_BODY]", body);
  }

  const handleClick = (Platform) => {
    var executableLink = getShareableLinkForPlatform(Platform)

    //  mail have different way to open the link
    if (Platform === "Mail") {
      window.location.href = executableLink; // Opens the default email client
      return
    } else {
      window.open(executableLink, '_blank', 'width=600,height=300');
    }

  };

  return (
    <div data-vf-google-analytics-region="share-this" className="mg-share-buttons-wrapper"  {...props}>
      <div className='mainLabel'>{labels.mainLabel}</div>
      <div className='share-buttons'>
        <button 
        data-vf-analytics-label="Social share: Facebook" 
        className="mg-share-button mg-button-primary" 
        onClick={() => handleClick("Facebook")} 
        aria-label='Share on Facebook' 
        title='Share on Facebook' >
          <img src={FacebookIconWhite} alt="Facebook SVG Image" />
        </button>
        <button 
        data-vf-analytics-label="Social share: Twitter" 
        className="mg-share-button mg-button-primary" 
        onClick={() => handleClick("Twitter")} 
        aria-label='Share on Twitter' 
        title='Share on Twitter' >
          <img src={TwitterIconWhite} alt="Twitter SVG Image" />

        </button>
        <button  
        data-vf-analytics-label="Social share: LinkedIn" 
        className="mg-share-button mg-button-primary" 
        onClick={() => handleClick("LinkedIn")} 
        aria-label='Share on LinkedIn' 
        title='Share on LinkedIn'  >
          <img src={LinkedInIconWhite} alt="LinkedIn SVG Image" />

        </button>
        <button 
        data-vf-analytics-label="Social share: Mail" 
        className="mg-share-button mg-button-primary" 
        onClick={() => handleClick("Mail")} 
        aria-label='Share via Email' 
        title='Share via Email'  >
          <img src={MailIconWhite} alt="Mail SVG Image" />
        </button>
      </div>

      <CopyButton className='copy-button-wrapper' copiedLabel={labels.onCopy} sharedLink={sharedLink} />
    </div>
  );
}
/**
*  CopyButton
*  @param {string} copiedLabel - the label that will be shown when the link is coppied(should be in the right language)
*  @param {string} sharedLink - the link that will be coppied
*/
function CopyButton({ copiedLabel, sharedLink,  className }) {

  const [coppied, setCoppied] = React.useState(false);
  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedLink);
    setCoppied(true);
  }

  return (
    <button data-vf-analytics-label="Quick link copy"  aria-label='Copy to Clipboard' title='Copy to Clipboard' className={className} onClick={() => handleCopyLink()}>
      <div className='paperclipIcon'>
        <img src={LinkIcon} alt="Link Icon" />
      </div>
      <div className='copyText'>{coppied ? copiedLabel : sharedLink}</div>
      <div className='stackIcon'>

        {
          coppied ?
            <img src={CheckIcon} alt="check Icon" /> :
            <img src={CopyIcon} alt="copy Icon" />
        }

      </div>
    </button>)
}

