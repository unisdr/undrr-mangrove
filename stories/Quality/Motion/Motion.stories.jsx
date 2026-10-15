/** Test-only composed fixtures for the browser gate, not public components. */
import React, { useState } from 'react';
import { Loader } from '../../Utilities/Loader/Loader';
import { ProgressBar } from '../../Components/ProgressBar/ProgressBar';
import { Gallery } from '../../Components/Gallery/Gallery';
import MegaMenu from '../../Components/MegaMenu/MegaMenu';
import { Drawer } from '../../Components/Navigation/Drawer/Drawer';
import { DetailsTag } from '../../Atom/ReachElement/Details/Details';

export default {
  title: 'Quality/Motion',
  tags: ['!autodocs', 'test-only'],
  parameters: { layout: 'fullscreen' },
};

export const Loading = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <Loader size="inline" label="Loading fixture" />
      <ProgressBar label="Fetching fixture" />
    </div>
  ),
};

const media = [
  {
    id: 'video',
    type: 'video',
    src: '/__motion__/pending.mp4',
    title: 'Loading video',
  },
  ...Array.from({ length: 15 }, (_, index) => ({
    id: `slide-${index}`,
    type: 'html',
    html: `<p>Slide ${index + 1}</p>`,
    title: `Slide ${index + 1}`,
  })),
];
export const GalleryLoading = {
  render: () => (
    <div style={{ maxWidth: '600px', padding: '1rem' }}>
      <Gallery media={media} thumbnailPosition="bottom" />
    </div>
  ),
};

const sections = ['Resources', 'About'].map((title, index) => ({
  title,
  items: [
    {
      title: `${title} topics`,
      url: '#topics',
      items: Array.from({ length: 30 }, (_, item) => ({
        title: `${title} destination ${item + 1}`,
        url: `#destination-${index}-${item}`,
      })),
    },
  ],
}));
export const Navigation = {
  render: () => <MegaMenu sections={sections} hoverDelay={0} delay={5000} />,
};

function DrawerFixture() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="mg-button mg-button-primary"
        onClick={() => setOpen(true)}
      >
        Open fixture drawer
      </button>
      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Fixture filters"
      >
        <a href="#filter">Filter destination</a>
      </Drawer>
    </>
  );
}
export const DrawerInteraction = { render: () => <DrawerFixture /> };
export const DetailsInteraction = {
  render: () => (
    <DetailsTag summary="Fixture details" details="Fixture content" />
  ),
};
