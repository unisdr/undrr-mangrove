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
    variant: 'outline',
  },
};

export const Primary = {
  args: {
    textToCopy: 'https://undrr.org',
    variant: 'primary',
  },
};

export const InContext = {
  render: args => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px',
      }}
    >
      <code style={{ fontFamily: 'var(--mg-font-family-code)' }}>
        npm install @undrr/mangrove
      </code>
      <CopyButton {...args} />
    </div>
  ),
  args: {
    textToCopy: 'npm install @undrr/mangrove',
  },
};
