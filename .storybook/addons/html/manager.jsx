import React, { useEffect, useState } from 'react';
import {
  addons,
  types,
  useChannel,
  useStorybookState,
} from 'storybook/manager-api';
import { AddonPanel, SyntaxHighlighter } from 'storybook/internal/components';
import { PANEL_ID, READY, REQUEST, UPDATE } from './events';

const HtmlPanel = () => {
  // Storybook 10 prerenders panels with active:true even when another tab is
  // selected. Use manager state so hidden panels do not keep observing DOM.
  const { storyId, selectedPanel, layout, viewMode } = useStorybookState();
  const active =
    selectedPanel === PANEL_ID && layout.showPanel && viewMode === 'story';
  const [result, setResult] = useState();
  const emit = useChannel(
    {
      [UPDATE]: data => {
        if (active && data.storyId === storyId) setResult(data);
      },
      [READY]: data => {
        if (data.storyId === storyId) {
          setResult(undefined);
          emit(REQUEST, { storyId, active });
        }
      },
    },
    [storyId, active]
  );
  useEffect(() => {
    setResult(undefined);
    emit(REQUEST, { storyId, active });
    return () => emit(REQUEST, { storyId, active: false });
  }, [emit, storyId, active]);
  const current = result?.storyId === storyId ? result : undefined;
  return (
    <AddonPanel active={active}>
      {current?.warning && <p role="status">{current.warning}</p>}
      {current?.status === 'ready' ? (
        <SyntaxHighlighter language="html" copyable padded format={false}>
          {current.code}
        </SyntaxHighlighter>
      ) : (
        <p role="status">
          {current?.status === 'error'
            ? 'HTML unavailable.'
            : 'Reading live HTML…'}
        </p>
      )}
    </AddonPanel>
  );
};

addons.register('mangrove/html', () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'HTML',
    match: ({ viewMode }) => viewMode === 'story',
    paramKey: 'html',
    render: () => <HtmlPanel />,
  });
});
