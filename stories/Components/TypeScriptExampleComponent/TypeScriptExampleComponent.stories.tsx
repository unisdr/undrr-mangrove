import type { Meta, StoryObj } from '@storybook/react-vite';
import TypeScriptExampleComponent from './TypeScriptExampleComponent';

const meta: Meta<typeof TypeScriptExampleComponent> = {
  title: 'Example/TypeScript component',
  component: TypeScriptExampleComponent,
};

export default meta;
type Story = StoryObj<typeof TypeScriptExampleComponent>;

export const Submit: Story = {
  args: {
    label: 'Submit',
    type: 'Secondary',
    width: 400,
  },
};

export const Check: Story = {
  args: {
    label: 'Check',
    type: 'Secondary',
    width: 400,
  },
};
