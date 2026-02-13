import React, { useState } from 'react';
import { Pager } from './Pager';

export default {
  title: 'Components/Pager',
  component: Pager,
  argTypes: {
    page: { control: 'number' },
    totalPages: { control: 'number' },
    layout: {
      control: { type: 'radio' },
      options: ['centered', 'bar'],
    },
    isLoading: { control: 'boolean' },
    showJumpTo: { control: 'boolean' },
    emptyState: { control: 'text' },
  },
};

// Helper: stateful wrapper so stories respond to clicks
const StatefulPager = props => {
  const [page, setPage] = useState(props.page || 1);
  return <Pager {...props} page={page} onPageChange={setPage} />;
};

// --------------------------------------------------
// Stories
// --------------------------------------------------

export const Default = {
  render: () => <StatefulPager page={3} totalPages={20} />,
};

export const BarLayout = {
  render: () => (
    <StatefulPager
      page={3}
      totalPages={20}
      layout="bar"
      range={{ start: 21, end: 30 }}
      rangeLabel="Showing {start}–{end} of 200"
      showJumpTo
    />
  ),
  name: 'Bar layout',
};

export const UnknownTotal = {
  render: () => (
    <StatefulPager page={5} totalPages={null} showJumpTo layout="bar" />
  ),
  name: 'Unknown total',
};

export const EmptyState = {
  render: () => (
    <Pager
      page={1}
      onPageChange={() => {}}
      emptyState="No results matched your search."
      emptyAction={{
        label: 'Clear all filters',
        onClick: () => alert('Filters cleared'),
      }}
    />
  ),
  name: 'Empty state',
};

export const Loading = {
  render: () => (
    <Pager page={3} totalPages={20} isLoading onPageChange={() => {}} />
  ),
};

export const RTL = {
  render: () => (
    <div dir="rtl" lang="ar">
      <StatefulPager page={3} totalPages={20} ariaLabel="التنقل بين الصفحات" />
    </div>
  ),
};

export const Mobile = {
  render: () => <StatefulPager page={3} totalPages={20} />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const FewPages = {
  render: () => <StatefulPager page={2} totalPages={3} />,
  name: 'Few pages',
};

export const ManyPages = {
  render: () => <StatefulPager page={250} totalPages={500} />,
  name: 'Many pages',
};
