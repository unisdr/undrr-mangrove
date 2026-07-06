import React, { useState } from 'react';
import reactElementToJSXString from 'react-element-to-jsx-string';
import { Source } from '@storybook/addon-docs/blocks';

/**
 * Demo component that renders children and automatically shows the JSX source code.
 * Use this in MDX files to show visual demos with copyable code.
 *
 * @example
 * <Demo>
 *   <div className="mg-u-gap-100">
 *     <span>A</span>
 *     <span>B</span>
 *   </div>
 * </Demo>
 */
const Demo = ({
  children,
  title,
  showSource = true,
  sourceState = 'hidden', // 'shown', 'hidden', or 'none'
  language = 'html',
}) => {
  const [isSourceVisible, setIsSourceVisible] = useState(sourceState === 'shown');

  // Convert React elements to JSX string
  const sourceCode = reactElementToJSXString(children, {
    showFunctions: false,
    showDefaultProps: false,
    useBooleanShorthandSyntax: true,
    useFragmentShortSyntax: true,
    sortProps: false,
    // Convert className to class for HTML output
    filterProps: [],
  })
    // Convert className to class for HTML-like output
    .replace(/className=/g, 'class=')
    // Remove style objects (they're React-specific)
    .replace(/\s*style=\{\{[^}]+\}\}/g, '');

  const styles = {
    container: {
      marginBottom: '1.5rem',
      border: '1px solid #e5e5e5',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    header: {
      padding: '0.5rem 1rem',
      background: '#f5f5f5',
      borderBottom: '1px solid #e5e5e5',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      fontSize: '1.2rem',
      fontWeight: 600,
      color: '#333',
    },
    toggleButton: {
      padding: '0.25rem 0.75rem',
      fontSize: '1.1rem',
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    demo: {
      padding: '1.5rem',
      background: '#fff',
    },
    sourceWrapper: {
      borderTop: '1px solid #e5e5e5',
    },
  };

  return (
    <div style={styles.container}>
      {(title || sourceState !== 'none') && (
        <div style={styles.header}>
          {title && <h4 style={styles.title}>{title}</h4>}
          {sourceState !== 'none' && (
            <button
              style={styles.toggleButton}
              onClick={() => setIsSourceVisible(!isSourceVisible)}
            >
              {isSourceVisible ? 'Hide code' : 'Show code'}
            </button>
          )}
        </div>
      )}
      <div style={styles.demo}>{children}</div>
      {showSource && sourceState !== 'none' && isSourceVisible && (
        <div style={styles.sourceWrapper}>
          <Source code={sourceCode} language={language} dark />
        </div>
      )}
    </div>
  );
};

export default Demo;
