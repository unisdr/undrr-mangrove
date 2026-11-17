# Loading-indicator verification

Recorded on 17 October 2026 for the Mangrove 2.2 candidate, following [#1387](https://github.com/unisdr/undrr-mangrove/issues/1387). These checks found no rendering defect in the cases below. They do not establish screen-reader announcement behaviour or complete the issue's verification checklist.

## Environment and cases

- **Firefox 158.0, macOS 27.0:** installed browser driven through geckodriver 0.37.1 in an isolated, visible profile. Determinate native progress at 0, 45 and 100 out of 100 was checked across all five themes (15 cases): values, dimensions, labels and fill colours. Representative default-theme screenshots were visually reviewed. An Arabic indeterminate example selected RTL scanner motion and supported the `:has()` selector.
- **Firefox reduced motion:** a separate profile set the browser's reduced-motion preference before navigation. The composed loading fixture in RTL showed three stationary dashed Loader markers with existing labels, and a static indeterminate progress fallback. Computed media preference and animation state were checked; a screenshot was reviewed.
- **Safari 27.0, macOS 27.0:** visible native Safari, default theme. Native progress values and accessible labels at 0, 45 and 100 were read from the accessibility tree and visually reviewed. An Arabic 45% example filled from the right. Indeterminate progress showed a moving scanner in observations at different times. Default, inline and HTML Loader examples were visually reviewed. Safari WebDriver was unavailable because remote automation is disabled; no automation setting was changed.
- **Chromium production gate:** all five themes passed the existing 30 desktop/mobile, LTR/RTL, reduced-motion, forced-colour and combined scenarios. Forced-colour emulation is not a Windows assistive-technology check.

Firefox checks used the candidate's local Storybook. Safari used the same stories and then the built production Storybook for settled RTL, scanner and Loader observations. Relevant stories are `components-progress-bar--determinate`, `components-progress-bar--indeterminate` and `quality-motion--loading`. Local screenshots and probe output were retained under `/tmp/mangrove-220-browser/` during review; that temporary directory is not a published or durable test artifact.

## Outstanding verification

- Listen with **VoiceOver/Safari** and **NVDA/Firefox** to inserted nondecorative Loaders, application-owned persistent live-region loading/completion/failure messages, and determinate progress names/value text.
- Check native Safari reduced-motion behaviour, and Windows forced colours with the relevant browsers and assistive technology.
- Extend real-browser coverage beyond the representative cases above if a consumer requires it. Safari's checks are not a five-theme or mobile sweep.

No screen-reader listening test was completed in this session. Native accessibility-tree values and automated accessibility checks are useful evidence, but do not prove that announcements are spoken correctly. Keep #1387 open until the remaining results and limitations are reviewed. New complete/error APIs, the optional WCAG 2.2.2 helper and a Loader-size redesign remain separate enhancements.
