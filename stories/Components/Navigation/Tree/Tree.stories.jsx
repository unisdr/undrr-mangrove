import React from 'react';
import { Tree, TreeItem } from './Tree';

export default {
  title: 'Components/Navigation/Tree',
  component: Tree,
};

export const Default = () => (
  <Tree>
    <TreeItem id="1" label="Item 1">
      <TreeItem id="1-1" label="Item 1.1" />
      <TreeItem id="1-2" label="Item 1.2" />
    </TreeItem>
    <TreeItem id="2" label="Item 2" />
  </Tree>
);
