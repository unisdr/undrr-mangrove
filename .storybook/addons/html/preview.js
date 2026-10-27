import { addons, useEffect } from 'storybook/preview-api';
import { observeHtml } from './capture';
import { READY, REQUEST, UPDATE } from './events';

const withHtml = (Story, context) => {
  // Refresh after args/globals rerenders too. Cleanup cancels earlier formatting.
  useEffect(() => {
    if (context.viewMode !== 'story' || context.parameters.html?.disable)
      return;
    const channel = addons.getChannel();
    let stop;
    const request = ({ storyId, active }) => {
      if (storyId !== context.id) return;
      stop?.();
      stop = undefined;
      if (active) {
        stop = observeHtml(
          context.canvasElement,
          context.parameters.html,
          data => channel.emit(UPDATE, { ...data, storyId: context.id })
        );
      }
    };
    channel.on(REQUEST, request);
    channel.emit(READY, { storyId: context.id });
    return () => {
      channel.off(REQUEST, request);
      stop?.();
    };
  });
  return Story();
};

export const decorators = [withHtml];
