import React from 'react';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';

/**
 * Props for TypeScriptExampleComponent.
 *
 * Demonstrates typed props with a union type for `type` (instead of a
 * bare `string`) and an optional `onClick` handler.
 */
type ButtonProps = {
  /** Button label text */
  label: string;
  /** Visual style variant */
  type: 'Primary' | 'Secondary';
  /** Button width in pixels */
  width: number;
  /** Optional click handler */
  onClick?: () => void;
};

/**
 * Example TypeScript component that wraps CtaButton with typed props.
 *
 * This component exists as a reference for writing TypeScript components
 * in the Mangrove library. See the
 * [component standards](?path=/docs/contributing-component-standards--docs)
 * for conventions and best practices.
 */
function TypeScriptExampleComponent({
  label,
  type,
  width,
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <CtaButton
      label={label}
      Type={type}
      State="Default"
      variant="contained"
      style={{ width: `${width}px` }}
      onClick={onClick}
    >
      {label}
    </CtaButton>
  );
}

export default TypeScriptExampleComponent;
