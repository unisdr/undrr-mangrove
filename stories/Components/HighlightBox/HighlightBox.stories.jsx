import React from 'react';

export default {
  title: 'Components/HighlightBox',
  parameters: {
    layout: 'padded',
  },
};

const Template = args => <div className={args.className}>{args.children}</div>;

export const Default = Template.bind({});
Default.args = {
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
};

export const Primary = Template.bind({});
Primary.args = {
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
};

export const Secondary = Template.bind({});
Secondary.args = {
  className: 'mg-highlight-box mg-highlight-box--secondary',
  children: (
    <>
      <h3>Secondary Highlight Box</h3>
      <p>This uses the Sendai purple background with white text.</p>
      <p>Perfect for highlighting secondary information.</p>
    </>
  ),
};

export const Centered = Template.bind({});
Centered.args = {
  className: 'mg-highlight-box mg-highlight-box--centered',
  children: (
    <>
      <h3>Centered Highlight Box</h3>
      <p>This box is 80% width and centered horizontally.</p>
      <p>Great for drawing attention to important content.</p>
    </>
  ),
};

export const CenteredPrimary = Template.bind({});
CenteredPrimary.args = {
  className:
    'mg-highlight-box mg-highlight-box--primary mg-highlight-box--centered',
  children: (
    <>
      <h3>Centered Primary Box</h3>
      <p>You can combine tone and layout variants.</p>
    </>
  ),
};

export const WithVideo = Template.bind({});
WithVideo.args = {
  className: 'mg-highlight-box mg-highlight-box--primary',
  children: (
    <iframe
      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
      title="Video example"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ),
};

export const FloatStart = () => (
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
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
      doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo
      inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
    </p>
  </div>
);

export const FloatEnd = () => (
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
);

export const WithImage = Template.bind({});
WithImage.args = {
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
};

export const WithList = Template.bind({});
WithList.args = {
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
};
