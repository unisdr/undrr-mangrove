import { withLanguage } from '../../../../.storybook/withLanguage';
import ShareButtons from './ShareButtons';
import { expect, fn } from 'storybook/test';

export default {
  title: 'Components/Buttons/ShareButtons',
  component: ShareButtons,
  decorators: [withLanguage],
  argTypes: {
    sharingSubject: {
      control: { type: 'text' },
      defaultValue: 'Sharing Link',
    },
    sharingBody: {
      control: { type: 'text' },
      defaultValue: 'Check out this link: ',
    },
  },
};

export const DefaultShareButtons = {
  name: 'ShareButtons',
};

const withDeviceSharing = enabled => () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'share');
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: enabled ? fn().mockResolvedValue(undefined) : undefined,
  });
  return () => {
    if (descriptor) Object.defineProperty(navigator, 'share', descriptor);
    else delete navigator.share;
  };
};

const renderSidebar = args => (
  <div
    data-share-container
    style={{ inlineSize: '16rem', maxInlineSize: '100%' }}
  >
    <ShareButtons {...args} />
  </div>
);

const checkLayout = async ({ canvasElement }, expectedCount) => {
  const container = canvasElement.querySelector('[data-share-container]');
  const buttons = [...container.querySelectorAll('.mg-share__button')];
  await expect(buttons).toHaveLength(expectedCount);
  const originalSize = container.style.inlineSize;
  try {
    await [400, 265, 256, 250, 249, 240, 192, 130, 96].reduce(
      async (previous, width) => {
        await previous;
        container.style.inlineSize = `${width}px`;
        await new Promise(resolve => requestAnimationFrame(resolve));
        const rects = buttons.map(button => button.getBoundingClientRect());
        const rows = new Map();
        rects.forEach(rect => {
          rows.set(rect.top, (rows.get(rect.top) ?? 0) + 1);
          expect(rect.width).toBeGreaterThanOrEqual(40);
          expect(rect.height).toBeGreaterThanOrEqual(40);
          expect(rect.left).toBeGreaterThanOrEqual(
            container.getBoundingClientRect().left
          );
          expect(rect.right).toBeLessThanOrEqual(
            container.getBoundingClientRect().right + 1
          );
        });
        await expect([...rows.values()]).toEqual(
          width >= 250
            ? [expectedCount]
            : width >= 130
              ? expectedCount === 6
                ? [3, 3]
                : [3, 2]
              : expectedCount === 6
                ? [2, 2, 2]
                : [2, 2, 1]
        );
        await expect(container.scrollWidth).toBeLessThanOrEqual(width);
      },
      Promise.resolve()
    );
  } finally {
    container.style.inlineSize = originalSize;
  }
};

export const NarrowSidebar = {
  name: 'Narrow sidebar (six actions)',
  beforeEach: withDeviceSharing(true),
  render: renderSidebar,
  play: context => checkLayout(context, 6),
};

export const NarrowSidebarWithoutDeviceSharing = {
  name: 'Narrow sidebar (five actions)',
  beforeEach: withDeviceSharing(false),
  render: renderSidebar,
  play: context => checkLayout(context, 5),
};

export const NarrowSidebarRtl = {
  name: 'Narrow sidebar (Arabic)',
  args: { lang: 'ar', dir: 'rtl' },
  beforeEach: withDeviceSharing(true),
  render: renderSidebar,
  play: context => checkLayout(context, 6),
};

export const CompactContainer = {
  name: 'Compact container',
  beforeEach: withDeviceSharing(true),
  render: args => (
    <div style={{ inlineSize: '12rem', maxInlineSize: '100%' }}>
      <ShareButtons {...args} />
    </div>
  ),
};
