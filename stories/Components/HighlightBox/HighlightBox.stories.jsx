import React from 'react';

export default {
  title: 'Components/HighlightBox',
  parameters: {
    layout: 'padded',
  },
};

export const Default = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box',
    children: (
      <>
        <h3>Default Highlight Box</h3>
        <p>
          This is a default highlight box with light background and dark border.
        </p>
        <p>
          It can contain multiple paragraphs and any content you need to
          emphasize.
        </p>
      </>
    ),
  },
};

export const Primary = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box mg-highlight-box--primary',
    children: (
      <>
        <h3>Primary Highlight Box</h3>
        <p>This uses the corporate blue background with white text.</p>
        <p>
          <a href="#">Links inherit white color</a> for better visibility.
        </p>
      </>
    ),
  },
};

export const Secondary = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box mg-highlight-box--secondary',
    children: (
      <>
        <h3>Secondary Highlight Box</h3>
        <p>This uses the Sendai purple background with white text.</p>
        <p>Perfect for highlighting secondary information.</p>
      </>
    ),
  },
};

export const Centered = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box mg-highlight-box--centered',
    children: (
      <>
        <h3>Centered Highlight Box</h3>
        <p>This box is 80% width and centered horizontally.</p>
        <p>Great for drawing attention to important content.</p>
      </>
    ),
  },
};

export const CenteredPrimary = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className:
      'mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered',
    children: (
      <>
        <h3>Centered Primary Box</h3>
        <p>You can combine tone and layout variants.</p>
      </>
    ),
  },
};

export const WithVideo = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box mg-highlight-box--primary',
    children: (
      <>
        <h3>Featured video</h3>
        <iframe
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Video example"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <p>
          Videos and other embedded media work well inside highlight boxes to
          draw attention to important content.
        </p>
      </>
    ),
  },
};

export const FloatStart = {
  render: () => (
    <div>
      <div className="mg-highlight-box mg-highlight-box--float-start mg-highlight-box--secondary">
        <h4>Floated Box</h4>
        <p>
          This box floats to the start (left in LTR, right in RTL) on larger
          screens.
        </p>
        <p>On mobile, it stacks normally.</p>
      </div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
      <p>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
      <p>
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem
        accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab
        illo inventore veritatis et quasi architecto beatae vitae dicta sunt
        explicabo.
      </p>
    </div>
  ),
};

export const FloatEnd = {
  render: () => (
    <div>
      <div className="mg-highlight-box mg-highlight-box--float-end mg-highlight-box--primary">
        <h4>Float End</h4>
        <p>This floats to the end (right in LTR, left in RTL).</p>
      </div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
      <p>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  ),
};

export const WithImage = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box',
    children: (
      <>
        <h3>Box with Image</h3>
        <img
          src="https://via.placeholder.com/600x400"
          alt="Placeholder"
          style={{ width: '100%', height: 'auto' }}
        />
        <p>Images work perfectly inside highlight boxes.</p>
      </>
    ),
  },
};

export const WithList = {
  render: args => <div className={args.className}>{args.children}</div>,
  args: {
    className: 'mg-highlight-box mg-highlight-box--secondary',
    children: (
      <>
        <h3>Key Points</h3>
        <ul>
          <li>Supports multiple tone variants</li>
          <li>Responsive layout options</li>
          <li>RTL-safe using logical properties</li>
          <li>Works with any nested content</li>
        </ul>
      </>
    ),
  },
};

// RTL examples
export const RTLFloatStart = {
  name: 'RTL float start (appears on right)',
  render: () => (
    <div style={{ direction: 'rtl' }}>
      <div className="mg-highlight-box mg-highlight-box--float-start mg-highlight-box--secondary">
        <h4>صندوق عائم</h4>
        <p>يطفو هذا الصندوق إلى البداية (اليمين في RTL).</p>
      </div>
      <p>
        هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا
        النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من
        النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.
      </p>
      <p>
        إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد
        الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية.
      </p>
    </div>
  ),
};

export const RTLFloatEnd = {
  name: 'RTL float end (appears on left)',
  render: () => (
    <div style={{ direction: 'rtl' }}>
      <div className="mg-highlight-box mg-highlight-box--float-end mg-highlight-box--primary">
        <h4>صندوق عائم</h4>
        <p>يطفو هذا الصندوق إلى النهاية (اليسار في RTL).</p>
      </div>
      <p>
        هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا
        النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من
        النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق.
      </p>
      <p>
        إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد
        الفقرات كما تريد، النص لن يبدو مقسما ولا يحوي أخطاء لغوية.
      </p>
    </div>
  ),
};
