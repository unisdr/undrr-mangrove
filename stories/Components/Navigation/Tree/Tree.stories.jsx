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
  <Tree aria-label="Knowledge base sections" defaultExpandedIds={['sendai']}>
    <TreeItem id="sendai" label="Sendai Framework">
      <TreeItem id="priorities" label="Priorities for action" />
      <TreeItem id="targets" label="Targets and indicators" />
      <TreeItem id="monitor" label="Sendai Framework Monitor" />
    </TreeItem>
    <TreeItem id="hazards" label="Hazard information profiles">
      <TreeItem id="hydromet" label="Meteorological and hydrological" />
      <TreeItem id="geohazards" label="Geological and seismic" />
    </TreeItem>
    <TreeItem id="terminology" label="Terminology" />
  </Tree>
);

export const WithLinks = () => (
  <Tree
    aria-label="Knowledge base sections"
    defaultExpandedIds={['sendai']}
    defaultSelectedId="targets"
  >
    <TreeItem
      id="sendai"
      label="Sendai Framework"
      href="/sendai-framework"
      asLink
    >
      <TreeItem
        id="priorities"
        label="Priorities for action"
        href="/sendai-framework/priorities"
        asLink
      />
      <TreeItem
        id="targets"
        label="Targets and indicators"
        href="/sendai-framework/targets"
        asLink
        current="page"
      />
    </TreeItem>
    <TreeItem id="terminology" label="Terminology" href="/terminology" asLink />
  </Tree>
);

export const CustomToggleIcon = {
  args: { toggleIcon: 'mg-icon-arrow-right' },
  render: args => (
    <Tree
      aria-label="Knowledge base sections"
      defaultExpandedIds={['sendai']}
      {...args}
    >
      <TreeItem id="sendai" label="Sendai Framework">
        <TreeItem id="priorities" label="Priorities for action" />
        <TreeItem id="targets" label="Targets and indicators" />
      </TreeItem>
      <TreeItem id="hazards" label="Hazard information profiles">
        <TreeItem id="hydromet" label="Meteorological and hydrological" />
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
