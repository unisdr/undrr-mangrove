import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock react-syntax-highlighter to avoid ESM/CJS incompatibilities in Jest.
// We test structure and accessibility, not the highlighting output itself.
jest.mock('react-syntax-highlighter', () => {
  const PrismLight = ({ children, language }) => (
    <pre>
      <code className={`language-${language}`}>{children}</code>
    </pre>
  );
  PrismLight.registerLanguage = () => {};
  return { PrismLight };
});
jest.mock(
  'react-syntax-highlighter/dist/esm/languages/prism/bash',
  () => ({}),
);
jest.mock(
  'react-syntax-highlighter/dist/esm/languages/prism/javascript',
  () => ({}),
);
jest.mock(
  'react-syntax-highlighter/dist/esm/languages/prism/jsx',
  () => ({}),
);

import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  // --------------------------------------------------
  // Rendering — plain
  // --------------------------------------------------

  it('renders code in a pre/code block', () => {
    render(<CodeBlock code="const x = 1;" />);

    const pre = document.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre.querySelector('code')).toBeInTheDocument();
    expect(pre.textContent).toContain('const x = 1;');
  });

  it('does not render a figure when no filename is given', () => {
    const { container } = render(<CodeBlock code="echo hello" />);
    expect(container.querySelector('figure')).toBeNull();
  });

  // --------------------------------------------------
  // Rendering — with language
  // --------------------------------------------------

  it('applies language class when language prop is provided', () => {
    const { container } = render(
      <CodeBlock code="echo hello" language="bash" />,
    );
    // react-syntax-highlighter sets class="language-bash" on the inner <code>
    const codeEl = container.querySelector('code[class*="language-bash"]');
    expect(codeEl).toBeInTheDocument();
  });

  it('renders plain block without syntax highlighter when no language given', () => {
    const { container } = render(<CodeBlock code="plain code" />);
    // No language-* class should be present
    expect(container.querySelector('code[class*="language-"]')).toBeNull();
    expect(container.querySelector('code').textContent).toBe('plain code');
  });

  // --------------------------------------------------
  // Rendering — with filename
  // --------------------------------------------------

  it('renders figure.mg-code-block when filename is provided', () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" filename="index.js" />,
    );
    expect(container.querySelector('figure.mg-code-block')).toBeInTheDocument();
    expect(container.querySelector('figcaption').textContent).toBe('index.js');
  });

  it('renders figure with both filename and language', () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" language="javascript" filename="index.js" />,
    );
    expect(container.querySelector('figure.mg-code-block')).toBeInTheDocument();
    expect(container.querySelector('figcaption').textContent).toBe('index.js');
    expect(
      container.querySelector('code[class*="language-javascript"]'),
    ).toBeInTheDocument();
  });

  // --------------------------------------------------
  // Accessibility — plain
  // --------------------------------------------------

  it('has no a11y violations (plain)', async () => {
    const { container } = render(<CodeBlock code="const x = 1;" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Accessibility — with language
  // --------------------------------------------------

  it('has no a11y violations (with language)', async () => {
    const { container } = render(
      <CodeBlock code="echo hello" language="bash" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Accessibility — with filename
  // --------------------------------------------------

  it('has no a11y violations (with filename)', async () => {
    const { container } = render(
      <CodeBlock code="const x = 1;" filename="index.js" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // --------------------------------------------------
  // Accessibility — filename + language
  // --------------------------------------------------

  it('has no a11y violations (filename + language)', async () => {
    const { container } = render(
      <CodeBlock
        code="const x = 1;"
        language="javascript"
        filename="index.js"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
