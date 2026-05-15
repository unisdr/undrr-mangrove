import React from 'react';
import { CodeBlock } from './CodeBlock';

export default {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    language: {
      control: 'select',
      options: [undefined, 'bash', 'javascript', 'jsx'],
      description: 'Syntax highlighting language',
    },
    filename: {
      control: 'text',
      description: 'Optional filename for the header bar',
    },
  },
};

const jsxExample = `// React component example
import React from 'react';

const MyComponent = ({ title, children }) => {
  return (
    <div className="my-component">
      <h2>{title}</h2>
      {children}
    </div>
  );
};

export default MyComponent;`;

const bashExample = `#!/bin/bash
# Build and deploy the project
set -e

echo "Installing dependencies..."
npm ci --production

echo "Building assets..."
npm run build

echo "Deploy complete."`;

export const Plain = {
  args: {
    code: jsxExample,
  },
};

export const WithLanguage = {
  name: 'Syntax highlighted',
  args: {
    code: bashExample,
    language: 'bash',
  },
};

export const WithFilename = {
  name: 'With filename header',
  args: {
    code: jsxExample,
    filename: 'MyComponent.jsx',
  },
};

export const WithFilenameAndLanguage = {
  name: 'With filename + syntax highlighting',
  args: {
    code: bashExample,
    language: 'bash',
    filename: 'deploy.sh',
  },
};
