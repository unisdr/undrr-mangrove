import React, { useEffect, useRef } from 'react';
import createHydrator from '../../../../src/hydrate';
import { Tree, TreeItem } from './Tree';
import { HydratedTree } from './HydratedTree';
import treeFromElement from './Tree.fromElement';

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

export const WithLinks = () => (
  <Tree>
    <TreeItem id="1" label="Item 1" href="/item-1" asLink>
      <TreeItem id="1-1" label="Item 1.1" href="/item-1-1" asLink />
      <TreeItem id="1-2" label="Item 1.2" href="/item-1-2" asLink />
    </TreeItem>
    <TreeItem id="2" label="Item 2" href="/item-2" asLink />
  </Tree>
);

export const CustomToggleIcon = {
  args: { toggleIcon: 'mg-icon-arrow-right' },
  render: args => (
    <Tree defaultExpandedIds={['1']} {...args}>
      <TreeItem id="1" label="Item 1">
        <TreeItem id="1-1" label="Item 1.1" />
        <TreeItem id="1-2" label="Item 1.2" />
      </TreeItem>
      <TreeItem id="2" label="Item 2">
        <TreeItem id="2-1" label="Item 2.1" />
      </TreeItem>
    </Tree>
  ),
};

const HYDRATION_MARKUP = `
<ul>
  <li data-id="about" data-expanded>
    <a href="#about">About</a>
    <ul>
      <li data-id="team"><a href="#team" aria-current="page">Team</a></li>
      <li data-id="history"><a href="#history">History</a></li>
    </ul>
  </li>
  <li data-id="topics">
    Topics
    <ul>
      <li data-id="floods"><a href="#floods">Floods</a></li>
      <li data-id="drought"><a href="#drought">Drought</a></li>
    </ul>
  </li>
  <li data-id="contact"><a href="#contact">Contact</a></li>
</ul>`;

const HydrationDemo = () => {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    host.innerHTML = `<div data-mg-tree data-aria-label="Section navigation" data-toggle-icon="mg-icon-arrow-right">${HYDRATION_MARKUP}</div>`;
    const hydrator = createHydrator({
      selector: '[data-mg-tree]',
      component: HydratedTree,
      fromElement: treeFromElement,
    });
    const container = host.firstElementChild;
    return () => {
      // Unmount outside React's commit phase to avoid unmounting one root
      // while another is still rendering.
      setTimeout(() => {
        hydrator.unmountAll();
        container.remove();
      });
    };
  }, []);

  return <div ref={ref} />;
};

export const HydratedFromHtml = {
  name: 'Hydrated from HTML',
  render: () => <HydrationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'A server-rendered nested list inside `data-mg-tree`, hydrated with `createHydrator`. The list works as plain links before JavaScript runs.',
      },
    },
  },
};
