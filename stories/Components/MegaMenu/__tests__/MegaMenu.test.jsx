import PropTypes from 'prop-types';
import MegaMenu from '../MegaMenu';

// React 19 no longer invokes PropTypes validation at runtime, but the
// declarations on MegaMenu.propTypes still drive react-docgen output,
// Storybook autodocs, and the AI manifest — so the contract needs to
// stay accurate. These tests invoke checkPropTypes directly to verify
// the declared shape matches the documented section-object contract.
describe('MegaMenu propTypes', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    PropTypes.resetWarningCache();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('flags a section missing the required title', () => {
    PropTypes.checkPropTypes(
      MegaMenu.propTypes,
      { sections: [{ bannerHeading: 'x' }] },
      'prop',
      'MegaMenu',
    );
    expect(consoleSpy).toHaveBeenCalled();
    const message = consoleSpy.mock.calls[0][0];
    expect(message).toMatch(/title/);
    expect(message).toMatch(/required|marked as required/i);
  });

  it('flags a non-string icon on a section', () => {
    PropTypes.checkPropTypes(
      MegaMenu.propTypes,
      { sections: [{ title: 'Section', icon: 42 }] },
      'prop',
      'MegaMenu',
    );
    expect(consoleSpy).toHaveBeenCalled();
    const message = consoleSpy.mock.calls[0][0];
    expect(message).toMatch(/icon/);
  });

  it('accepts a well-formed section with title and optional icon', () => {
    PropTypes.checkPropTypes(
      MegaMenu.propTypes,
      {
        sections: [
          { title: 'Section A', icon: 'mg-icon mg-icon-globe' },
          { title: 'Section B' },
        ],
      },
      'prop',
      'MegaMenu',
    );
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
