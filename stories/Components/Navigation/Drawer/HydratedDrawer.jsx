import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Drawer } from './Drawer';

export const OPEN_EVENT = 'mg-drawer:open';
export const CLOSE_EVENT = 'mg-drawer:close';
export const TOGGLE_EVENT = 'mg-drawer:toggle';

/**
 * Stateful wrapper used by hydration, where no React parent owns isOpen.
 *
 * Opens and closes from:
 * - any element with data-mg-drawer-trigger="<container id>" (click toggles)
 * - mg-drawer:open / mg-drawer:close / mg-drawer:toggle events dispatched on
 *   the container element
 */
export const HydratedDrawer = ({
  isOpen: initialOpen = false,
  controlsId,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  useEffect(() => {
    if (!controlsId) return undefined;

    const handleClick = event => {
      const trigger = event.target.closest?.('[data-mg-drawer-trigger]');
      if (
        !trigger ||
        trigger.getAttribute('data-mg-drawer-trigger') !== controlsId
      ) {
        return;
      }
      event.preventDefault();
      setIsOpen(open => !open);
    };
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(value => !value);

    document.addEventListener('click', handleClick);
    const container = document.getElementById(controlsId);
    container?.addEventListener(OPEN_EVENT, open);
    container?.addEventListener(CLOSE_EVENT, close);
    container?.addEventListener(TOGGLE_EVENT, toggle);

    return () => {
      document.removeEventListener('click', handleClick);
      container?.removeEventListener(OPEN_EVENT, open);
      container?.removeEventListener(CLOSE_EVENT, close);
      container?.removeEventListener(TOGGLE_EVENT, toggle);
    };
  }, [controlsId]);

  useEffect(() => {
    if (!controlsId) return;
    document.querySelectorAll('[data-mg-drawer-trigger]').forEach(trigger => {
      if (trigger.getAttribute('data-mg-drawer-trigger') === controlsId) {
        trigger.setAttribute('aria-expanded', String(isOpen));
        trigger.setAttribute('aria-controls', controlsId);
      }
    });
  }, [controlsId, isOpen]);

  return <Drawer {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

HydratedDrawer.propTypes = {
  /** Initial open state */
  isOpen: PropTypes.bool,
  /** id of the hydration container, matched by data-mg-drawer-trigger */
  controlsId: PropTypes.string,
};

export default HydratedDrawer;
