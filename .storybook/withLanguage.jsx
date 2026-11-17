import React from 'react';

import { resolveLanguage } from './language';

/** Story args keep precedence; stories exercise the production lang API. */
export function withLanguage(Story, context) {
  return (
    <Story
      {...context}
      args={{
        ...context.args,
        ...(context.globals?.addonRtl === 'rtl' &&
        context.args.dir === undefined
          ? { dir: 'rtl' }
          : {}),
        lang: context.args.lang ?? resolveLanguage(context.globals).lang,
      }}
    />
  );
}
