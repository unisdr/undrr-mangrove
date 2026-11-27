import React, { useEffect, useRef } from 'react';
import { expect, userEvent, within } from 'storybook/test';
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

// The element a pointer click lands on, at a point inside a row.
const hitAt = (row, x, y) => {
  const box = row.getBoundingClientRect();
  return document.elementFromPoint(box.left + x(box), box.top + y(box));
};

const expectRowHits = async (canvasElement, id) => {
  const row = canvasElement.querySelector(
    `[data-mg-treeitem-id="${id}"] > .mg-tree__label-container`
  );
  const link = row.querySelector(':scope > a.mg-tree__label');
  const middle = box => box.height / 2;
  // Label text, blank padding past the label, and the padding above and below.
  await expect(hitAt(row, () => 40, middle)).toBe(link);
  await expect(hitAt(row, box => box.width - 2, middle)).toBe(link);
  await expect(
    hitAt(
      row,
      box => box.width - 2,
      () => 1
    )
  ).toBe(link);
  await expect(
    hitAt(
      row,
      box => box.width - 2,
      box => box.height - 1
    )
  ).toBe(link);
  return { row, link };
};

export const LinkedRowHitArea = {
  name: 'Linked row hit area',
  render: () => (
    <div style={{ maxInlineSize: '24rem' }}>
      <Tree aria-label="Report sections" defaultExpandedIds={['parent']}>
        <TreeItem
          id="parent"
          label="Linked parent"
          href="#linked-parent"
          asLink
        >
          <TreeItem id="leaf" label="Linked leaf" href="#linked-leaf" asLink />
        </TreeItem>
        <TreeItem id="group" label="Unlinked group">
          <TreeItem id="child" label="Child" href="#child" asLink />
        </TreeItem>
      </Tree>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A linked row is a link across its whole highlighted area. On a linked parent the chevron stays a separate expand and collapse control. An unlinked group expands from anywhere in its row.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const prevent = e => e.preventDefault();
    canvasElement.addEventListener('click', prevent);
    try {
      await expectRowHits(canvasElement, 'leaf');
      const { row, link } = await expectRowHits(canvasElement, 'parent');

      const toggle = row.querySelector(':scope > .mg-tree__toggle');
      const middle = box => box.height / 2;
      const toggleBox = toggle.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const chevron = hitAt(
        row,
        () => toggleBox.left - rowBox.left + toggleBox.width / 2,
        middle
      );
      await expect(toggle.contains(chevron)).toBe(true);
      await expect(link.contains(chevron)).toBe(false);

      const parent = canvas.getByRole('treeitem', { name: /Linked parent/ });
      await expect(parent).toHaveAttribute('aria-expanded', 'true');
      await userEvent.click(toggle);
      await expect(parent).toHaveAttribute('aria-expanded', 'false');

      const group = canvas.getByRole('treeitem', { name: /Unlinked group/ });
      const groupRow = group.querySelector(
        ':scope > .mg-tree__label-container'
      );
      await expect(groupRow.querySelector('a')).toBeNull();
      const groupBox = groupRow.getBoundingClientRect();
      await userEvent.pointer({
        keys: '[MouseLeft]',
        target: groupRow,
        coords: {
          clientX: groupBox.right - 2,
          clientY: groupBox.top + groupBox.height / 2,
        },
      });
      await expect(group).toHaveAttribute('aria-expanded', 'true');
    } finally {
      canvasElement.removeEventListener('click', prevent);
    }
  },
};

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
