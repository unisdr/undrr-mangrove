import React from 'react';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';

type ButtonProps = {
  label: string;
  type: string;
  width: number;
};
function TypeScriptExampleComponent({ label, type, width }: ButtonProps) {
  return (
    <>
      <CtaButton
        label={label}
        Type={type}
        State="Default"
        For_Primary="Text"
        variant="contained"
        style={{ width: `${width}px` }}
      >
        {label}
      </CtaButton>
    </>
  );
}

export default TypeScriptExampleComponent;
