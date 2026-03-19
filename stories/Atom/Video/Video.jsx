import React from 'react';
import PropTypes from 'prop-types';
// import './video.scss';

/**
 * Renders an auto-playing, muted, looping MP4 video with caption tracks.
 *
 * @param {Object} props
 * @param {string} props.src     URL of the MP4 video source
 * @param {string} [props.width] Width of the video element
 * @param {string} [props.height] Height of the video element
 */
export const Video = ({ src, width, height }) => (
  <video
    width={width}
    height={height}
    preload="auto"
    autoPlay="autoplay"
    muted
    loop
  >
    <source src={src} type="video/mp4" />
    <track kind="captions" srcLang="en" label="english_captions" />
    <track kind="captions" srcLang="ar" label="arabic_captions" />
    Your browser does not support HTML5 video.
  </video>
);

Video.propTypes = {
  /** URL of the MP4 video source. */
  src: PropTypes.string.isRequired,
  /** Width of the video element (e.g. '640' or '100%'). */
  width: PropTypes.string,
  /** Height of the video element (e.g. '360' or 'auto'). */
  height: PropTypes.string,
};
