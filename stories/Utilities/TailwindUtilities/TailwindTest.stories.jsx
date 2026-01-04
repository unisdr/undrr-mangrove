export default {
  title: 'Utilities/Tailwind CSS/Testing',
  parameters: {
    docs: {
      description: {
        component:
          'Test utilities to verify Tailwind CSS integration with Mangrove design tokens. Both standard Tailwind class names and Mangrove verbose names are supported.',
      },
    },
  },
};

export const SpacingUtilities = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Spacing Utilities Test</h2>

    <h3 className="text-400 mb-100">Standard Tailwind Names</h3>
    <div className="flex gap-100">
      <div className="p-100 bg-blue-50">p-100</div>
      <div className="p-150 bg-blue-100">p-150</div>
      <div className="p-200 bg-blue-200">p-200</div>
      <div className="p-250 bg-blue-300">p-250</div>
    </div>

    <h3 className="text-400 mt-200 mb-100">Mangrove Verbose Names</h3>
    <div className="mg-u-display--flex mg-u-gap-100">
      <div className="mg-u-padding-100 mg-u-background-color--orange-50">
        mg-u-padding-100
      </div>
      <div className="mg-u-padding-150 mg-u-background-color--orange-100">
        mg-u-padding-150
      </div>
      <div className="mg-u-padding-200 mg-u-background-color--orange-200">
        mg-u-padding-200
      </div>
    </div>

    <h3 className="text-400 mt-200 mb-100">Margin Utilities</h3>
    <div className="flex gap-100">
      <div className="mt-100 p-100 bg-neutral-50">mt-100</div>
      <div className="mb-150 p-100 bg-neutral-100">mb-150</div>
      <div className="ml-200 p-100 bg-neutral-200">ml-200</div>
      <div className="mr-250 p-100 bg-neutral-300">mr-250</div>
    </div>
  </div>
);

export const FlexboxUtilities = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Flexbox Utilities Test</h2>

    <h3 className="text-400 mb-100">Standard Tailwind</h3>
    <div className="flex justify-center items-center gap-150 p-200 bg-neutral-50">
      <div className="p-100 bg-blue-900 text-white">Item 1</div>
      <div className="p-100 bg-orange-900 text-white">Item 2</div>
      <div className="p-100 bg-red-900 text-white">Item 3</div>
    </div>

    <h3 className="text-400 mt-200 mb-100">Mangrove Verbose</h3>
    <div className="mg-u-display--flex mg-u-justify-content--between mg-u-align-items--center mg-u-gap-150 mg-u-padding-200 mg-u-background-color--neutral-25">
      <div className="mg-u-padding-100 mg-u-background-color--blue-900 mg-u-color--white">
        Item 1
      </div>
      <div className="mg-u-padding-100 mg-u-background-color--orange-900 mg-u-color--white">
        Item 2
      </div>
      <div className="mg-u-padding-100 mg-u-background-color--red-900 mg-u-color--white">
        Item 3
      </div>
    </div>

    <h3 className="text-400 mt-200 mb-100">Flex Direction</h3>
    <div className="flex gap-200">
      <div className="flex flex-col gap-100 p-100 bg-blue-50">
        <div className="p-50 bg-blue-900 text-white">Column 1</div>
        <div className="p-50 bg-blue-800 text-white">Column 2</div>
        <div className="p-50 bg-blue-700 text-white">Column 3</div>
      </div>
      <div className="mg-u-display--flex mg-u-flex-direction--column mg-u-gap-100 mg-u-padding-100 mg-u-background-color--orange-50">
        <div className="mg-u-padding-50 mg-u-background-color--orange-900 mg-u-color--white">
          Verbose 1
        </div>
        <div className="mg-u-padding-50 mg-u-background-color--orange-800 mg-u-color--white">
          Verbose 2
        </div>
        <div className="mg-u-padding-50 mg-u-background-color--orange-700 mg-u-color--white">
          Verbose 3
        </div>
      </div>
    </div>
  </div>
);

export const TypographyUtilities = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Typography Utilities Test</h2>

    <div className="mb-200">
      <h3 className="text-400 mb-100">Font Sizes (Standard Tailwind)</h3>
      <p className="text-100">text-100 (10px)</p>
      <p className="text-200">text-200 (12.5px)</p>
      <p className="text-300">text-300 (16px - body)</p>
      <p className="text-400">text-400 (18px)</p>
      <p className="text-500">text-500 (23px)</p>
    </div>

    <div className="mb-200">
      <h3 className="text-400 mb-100">Font Sizes (Mangrove Verbose)</h3>
      <p className="mg-u-font-size--100">mg-u-font-size--100 (10px)</p>
      <p className="mg-u-font-size--200">mg-u-font-size--200 (12.5px)</p>
      <p className="mg-u-font-size--300">mg-u-font-size--300 (16px - body)</p>
      <p className="mg-u-font-size--400">mg-u-font-size--400 (18px)</p>
      <p className="mg-u-font-size--500">mg-u-font-size--500 (23px)</p>
    </div>

    <div className="mb-200">
      <h3 className="text-400 mb-100">Font Weights</h3>
      <p className="font-300">font-300 - Light</p>
      <p className="font-400">font-400 - Regular</p>
      <p className="font-700">font-700 - Bold</p>
      <p className="font-900">font-900 - Black</p>
    </div>

    <div>
      <h3 className="text-400 mb-100">Text Alignment</h3>
      <p className="text-left bg-neutral-50 p-100 mb-50">
        Left aligned text (text-left)
      </p>
      <p className="text-center bg-neutral-50 p-100 mb-50">
        Center aligned text (text-center)
      </p>
      <p className="text-right bg-neutral-50 p-100 mb-50">
        Right aligned text (text-right)
      </p>
      <p className="mg-u-text-align--center bg-neutral-50 p-100">
        Mangrove verbose: mg-u-text-align--center
      </p>
    </div>
  </div>
);

export const ColorUtilities = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Color Utilities Test</h2>

    <h3 className="text-400 mb-100">Background Colors (Tailwind)</h3>
    <div className="flex gap-100 mb-200 flex-wrap">
      <div className="p-100 bg-blue-900 text-white">Blue 900</div>
      <div className="p-100 bg-orange-900 text-white">Orange 900</div>
      <div className="p-100 bg-red-900 text-white">Red 900</div>
      <div className="p-100 bg-neutral-700 text-white">Neutral 700</div>
      <div className="p-100 bg-blue-50">Blue 50</div>
      <div className="p-100 bg-orange-50">Orange 50</div>
      <div className="p-100 bg-red-50">Red 50</div>
      <div className="p-100 bg-neutral-100">Neutral 100</div>
    </div>

    <h3 className="text-400 mb-100">Background Colors (Mangrove existing)</h3>
    <div className="flex gap-100 mb-200 flex-wrap">
      <div className="p-100 mg-u-background-color--blue-900 mg-u-color--white">
        mg-u-background-color--blue-900
      </div>
      <div className="p-100 mg-u-background-color--orange-900 mg-u-color--white">
        mg-u-background-color--orange-900
      </div>
      <div className="p-100 mg-u-background-color--red-900 mg-u-color--white">
        mg-u-background-color--red-900
      </div>
    </div>

    <h3 className="text-400 mb-100">Text Colors (Tailwind)</h3>
    <div className="flex gap-150 flex-wrap">
      <span className="text-blue-900 text-500 font-700">Blue 900</span>
      <span className="text-orange-900 text-500 font-700">Orange 900</span>
      <span className="text-red-900 text-500 font-700">Red 900</span>
      <span className="text-neutral-700 text-500 font-700">Neutral 700</span>
    </div>
  </div>
);

export const ResponsiveUtilities = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Responsive Utilities Test</h2>
    <p className="mb-100 text-300">Resize browser to see changes</p>

    <div className="p-100 bg-blue-50 tablet:bg-orange-50 desktop:bg-red-50 mb-200">
      <p className="text-300 font-700">Standard Tailwind Responsive</p>
      <p className="text-250">Mobile: Blue background</p>
      <p className="text-250">Tablet (900px+): Orange background</p>
      <p className="text-250">Desktop (1164px+): Red background</p>
    </div>

    <div className="mt-200 p-100 tablet:p-200 desktop:p-300 bg-neutral-50">
      <p className="text-300 font-700">Responsive Padding</p>
      <p className="text-250">
        Padding increases: 100 → 200 (tablet) → 300 (desktop)
      </p>
    </div>

    <div className="mt-200">
      <h3 className="text-400 mb-100">Breakpoint Reference</h3>
      <ul className="text-300">
        <li className="mb-50">mobile: 480px and up</li>
        <li className="mb-50">tablet: 900px and up</li>
        <li className="mb-50">desktop: 1164px and up</li>
        <li className="mb-50">desktop-wide: 1440px and up</li>
      </ul>
    </div>
  </div>
);

export const PositionAndSizing = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Position & Sizing Test</h2>

    <h3 className="text-400 mb-100">Position Utilities</h3>
    <div className="relative h-200 bg-neutral-50 mb-200">
      <div className="absolute top-50 left-50 p-100 bg-blue-900 text-white">
        Absolute positioned (Tailwind)
      </div>
    </div>

    <div className="mg-u-position--relative mg-u-height--full bg-neutral-50 mb-200"
      style={{ height: '200px' }}>
      <div className="mg-u-position--absolute mg-u-top-0 mg-u-right-0 mg-u-padding-100 mg-u-background-color--orange-900 mg-u-color--white">
        Mangrove verbose positioning
      </div>
    </div>

    <h3 className="text-400 mb-100">Sizing Utilities</h3>
    <div className="w-full p-100 bg-orange-50 mb-100">
      w-full (100% width - Tailwind)
    </div>

    <div className="mg-u-width--full mg-u-padding-100 mg-u-background-color--blue-50 mb-100">
      mg-u-width--full (100% width - Mangrove)
    </div>

    <div className="flex gap-100">
      <div className="w-half p-100 bg-red-50">w-half (50%)</div>
      <div className="w-half p-100 bg-blue-50">w-half (50%)</div>
    </div>
  </div>
);

export const BordersAndShadows = () => (
  <div>
    <h2 className="text-600 font-700 mb-200">Borders & Shadows Test</h2>

    <h3 className="text-400 mb-100">Border Utilities</h3>
    <div className="flex gap-100 mb-200 flex-wrap">
      <div className="p-100 border-2 border-blue-900">border-2</div>
      <div className="p-100 mg-u-border-width--2 mg-u-border-style--solid">
        mg-u-border-width--2
      </div>
    </div>

    <h3 className="text-400 mb-100">Border Radius</h3>
    <div className="flex gap-100 mb-200 flex-wrap">
      <div className="p-100 bg-blue-900 text-white rounded-none">
        rounded-none
      </div>
      <div className="p-100 bg-blue-900 text-white rounded-sm">rounded-sm</div>
      <div className="p-100 bg-blue-900 text-white rounded-md">rounded-md</div>
      <div className="p-100 bg-blue-900 text-white rounded-full">
        rounded-full
      </div>
    </div>

    <h3 className="text-400 mb-100">Box Shadows</h3>
    <div className="flex gap-100 flex-wrap">
      <div className="p-100 bg-white shadow-sm">shadow-sm</div>
      <div className="p-100 bg-white shadow">shadow</div>
      <div className="p-100 bg-white shadow-md">shadow-md</div>
      <div className="p-100 bg-white shadow-lg">shadow-lg</div>
      <div className="p-100 bg-white mg-u-box-shadow--xl">
        mg-u-box-shadow--xl
      </div>
    </div>
  </div>
);

export const ComprehensiveTest = () => (
  <div className="p-200">
    <h1 className="text-900 font-900 mb-300 text-blue-900">
      Tailwind CSS Integration Test
    </h1>

    <div className="flex flex-col gap-200">
      <div className="p-200 bg-neutral-50 rounded-md">
        <h2 className="text-600 font-700 mb-100">Card with Tailwind</h2>
        <p className="text-300 mb-150">
          This card demonstrates various Tailwind utilities working together.
        </p>
        <div className="flex justify-between items-center">
          <span className="text-250 text-neutral-600">Standard Tailwind</span>
          <div className="flex gap-100">
            <div className="px-150 py-75 bg-blue-900 text-white rounded-sm">
              Button 1
            </div>
            <div className="px-150 py-75 bg-orange-900 text-white rounded-sm">
              Button 2
            </div>
          </div>
        </div>
      </div>

      <div className="mg-u-padding-200 mg-u-background-color--neutral-50 mg-u-border-radius--md">
        <h2 className="mg-u-font-size--600 mg-u-font-weight--700 mg-u-margin-bottom-100">
          Card with Mangrove
        </h2>
        <p className="mg-u-font-size--300 mg-u-margin-bottom-150">
          This card uses Mangrove verbose class names for the same result.
        </p>
        <div className="mg-u-display--flex mg-u-justify-content--between mg-u-align-items--center">
          <span className="mg-u-font-size--250 mg-u-color--neutral-600">
            Mangrove Verbose
          </span>
          <div className="mg-u-display--flex mg-u-gap-100">
            <div className="mg-u-padding-x-150 mg-u-padding-y-75 mg-u-background-color--blue-900 mg-u-color--white mg-u-border-radius--sm">
              Button 1
            </div>
            <div className="mg-u-padding-x-150 mg-u-padding-y-75 mg-u-background-color--orange-900 mg-u-color--white mg-u-border-radius--sm">
              Button 2
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-300 p-200 bg-blue-50 rounded-md">
      <h2 className="text-600 font-700 mb-150">Success!</h2>
      <p className="text-300">
        If you can see this page styled correctly, Tailwind CSS is successfully
        integrated with Mangrove design tokens. Both naming conventions are
        working as expected.
      </p>
    </div>
  </div>
);
