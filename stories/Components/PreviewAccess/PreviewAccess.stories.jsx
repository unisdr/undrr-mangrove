import React, { useEffect, useState } from 'react';
import PreviewAccess from './PreviewAccess';
import {
  mgPreviewAccess,
  mgPreviewAccessDestroy,
} from '../../assets/js/preview-access';

export default {
  title: 'Components/Preview access',
  component: PreviewAccess,
  parameters: {
    docs: {
      description: {
        component:
          'Page-level gate that hides an unfinished page behind a PIN-prompt modal until a reviewer enters the right code. Vanilla JS, body-level. Not a security mechanism: the PIN sits in the DOM. See the Docs tab for the HTML usage.',
      },
    },
  },
};

/**
 * Static visual preview of the modal panel. Renders the markup without
 * activating the body-level gate, so the docs page is not locked down.
 */
export const Default = {
  args: {
    eyebrow: 'UNDRR · Preview',
    title: 'Preview access required',
    message:
      'This page is in preview and is not yet ready for general distribution. Please enter the access PIN provided by UNDRR to continue.',
    pin: '5498',
    contactUrl: 'https://www.undrr.org/contact-us',
    contactLabel: 'Need help? Contact UNDRR',
  },
};

/**
 * Override copy for a specific product preview (DELTA Resilience example).
 */
export const ProductBranded = {
  name: 'Product-branded copy',
  args: {
    eyebrow: 'DELTA Resilience · Preview',
    title: 'This page is a preview',
    message:
      'The DELTA Resilience country dashboard is in active development and is not yet ready for public review. Enter the preview PIN to continue, or contact UNDRR if you need access.',
    pin: '5498',
    id: 'delta-2026-preview',
    contactUrl: 'https://www.undrr.org/contact-us',
    contactLabel: 'Need help? Contact UNDRR',
  },
};

/**
 * RTL preview with Arabic copy. Verifies the Arabic font swap and direction.
 */
export const ArabicRtl = {
  name: 'Arabic (RTL)',
  render: args => (
    <div lang="ar" dir="rtl">
      <PreviewAccess {...args} />
    </div>
  ),
  args: {
    eyebrow: 'UNDRR · معاينة',
    title: 'يلزم رمز الوصول للمعاينة',
    message:
      'هذه الصفحة قيد المعاينة وغير جاهزة للتوزيع العام بعد. يرجى إدخال رمز الوصول المقدم من UNDRR للمتابعة.',
    pinLabel: 'رمز الوصول',
    submitLabel: 'فتح',
    contactUrl: 'https://www.undrr.org/contact-us',
    contactLabel: 'هل تحتاج إلى مساعدة؟ تواصل مع UNDRR',
  },
};

/**
 * Live demo. Activates the real body-level gate inside an iframe-scoped
 * Storybook canvas. Reset to relock for testing the unlock flow again.
 */
export const LiveDemo = {
  name: 'Live demo (activates the gate)',
  parameters: {
    docs: {
      description: {
        story:
          'Activates the actual body-level gate. The overlay covers the Storybook canvas iframe; a successful PIN entry persists for the session. Use the Reset button to clear the unlock and try again.',
      },
    },
  },
  render: () => {
    const [armed, setArmed] = useState(false);
    const id = 'storybook-live-demo';

    useEffect(() => {
      if (!armed) return undefined;
      const gate = document.createElement('div');
      gate.setAttribute('data-mg-preview-access', '');
      gate.setAttribute('data-mg-preview-id', id);
      gate.setAttribute('data-mg-preview-pin', '5498');
      gate.setAttribute('data-mg-preview-title', 'This page is a preview');
      gate.setAttribute(
        'data-mg-preview-message',
        'Enter the preview PIN (default: 5498) to continue.'
      );
      document.body.insertBefore(gate, document.body.firstChild);
      mgPreviewAccess([gate]);
      return () => {
        mgPreviewAccessDestroy(gate);
        gate.remove();
      };
    }, [armed]);

    const reset = () => {
      try {
        sessionStorage.removeItem(`mg-preview-access:${id}`);
      } catch (e) {
        // best effort
      }
      setArmed(false);
    };

    return (
      <div style={{ padding: '1rem' }}>
        <p>
          The gate covers the entire canvas when activated. PIN:{' '}
          <code>5498</code>.
        </p>
        <button
          type="button"
          onClick={() => setArmed(true)}
          style={{ marginInlineEnd: '0.5rem' }}
          disabled={armed}
        >
          Activate gate
        </button>
        <button type="button" onClick={reset}>
          Reset session
        </button>
      </div>
    );
  },
};
