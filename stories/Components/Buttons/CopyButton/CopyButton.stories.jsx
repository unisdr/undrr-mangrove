import { CopyButton } from './CopyButton';

const meta = {
  title: 'Components/Buttons/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  argTypes: {
    textToCopy: { control: 'text' },
  },
};

export default meta;

export const Default = {
  args: {
    textToCopy: 'https://undrr.org',
  },
};

export const InContext = {
  render: args => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    >
      <code>npm install @undrr/mangrove</code>
      <CopyButton {...args} />
    </div>
  ),
  args: {
    textToCopy: 'npm install @undrr/mangrove',
  },
};
