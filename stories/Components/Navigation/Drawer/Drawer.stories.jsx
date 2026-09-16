import React, { useState } from 'react';
import { Drawer } from './Drawer';

export default {
  title: 'Components/Navigation/Drawer',
  component: Drawer,
};

export const Default = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Drawer</button>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Drawer Title"
        position="start"
      >
        <p>Drawer content goes here.</p>
      </Drawer>
    </>
  );
};
