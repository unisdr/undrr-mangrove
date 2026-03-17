/**
 * @file forms.js
 * @source manual (metadata + curated HTML)
 *
 * All content is manually maintained. Update the HTML examples
 * when the component markup changes. See scripts/ai-manifest/README.md for
 * the entry schema and available fields.
 */

export default {
  'components-forms-text-input': {
    vanillaHtml: true,
    description: 'Text input field with label, help text, required indicator, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-label--required',
      'mg-form-label--disabled',
      'mg-form-input',
      'mg-form-input--error',
      'mg-form-input--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Text input with label and help text',
        html: `<div class="mg-form-field">
  <label class="mg-form-label mg-form-label--required" for="org-name">Organization name</label>
  <input class="mg-form-input" type="text" id="org-name" name="org-name" required />
  <p class="mg-form-help">Enter the full legal name of your organization.</p>
</div>`,
      },
      {
        name: 'Text input with error',
        html: `<div class="mg-form-field">
  <label class="mg-form-label mg-form-label--required" for="email">Email address</label>
  <input class="mg-form-input mg-form-input--error" type="email" id="email" name="email" aria-describedby="email-error" required />
  <p class="mg-form-error" id="email-error" role="alert">Enter a valid email address.</p>
</div>`,
      },
    ],
  },

  'components-forms-select': {
    vanillaHtml: true,
    description: 'Dropdown select field with label, placeholder, help text, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-select',
      'mg-form-select--error',
      'mg-form-select--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Select input',
        html: `<div class="mg-form-field">
  <label class="mg-form-label" for="country">Country</label>
  <select class="mg-form-select" id="country" name="country">
    <option value="" disabled selected>Select a country</option>
    <option value="JP">Japan</option>
    <option value="NP">Nepal</option>
    <option value="PH">Philippines</option>
  </select>
</div>`,
      },
    ],
  },

  'components-forms-checkbox': {
    vanillaHtml: true,
    description: 'Styled checkbox with label. Error and disabled states available.',
    cssClasses: [
      'mg-form-check',
      'mg-form-check__input',
      'mg-form-check__input--checkbox',
      'mg-form-check__input--error',
      'mg-form-check__input--disabled',
      'mg-form-check__label',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Checkbox',
        html: `<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--checkbox" type="checkbox" id="terms" name="terms" />
  <label class="mg-form-check__label" for="terms">I agree to the terms and conditions</label>
</div>`,
      },
    ],
  },

  'components-forms-radio': {
    vanillaHtml: true,
    description: 'Styled radio button with label. Error and disabled states available.',
    cssClasses: [
      'mg-form-check',
      'mg-form-check__input',
      'mg-form-check__input--radio',
      'mg-form-check__label',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Radio group',
        html: `<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-gov" name="role" value="government" />
  <label class="mg-form-check__label" for="role-gov">Government</label>
</div>
<div class="mg-form-check">
  <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-ngo" name="role" value="ngo" />
  <label class="mg-form-check__label" for="role-ngo">NGO / Civil society</label>
</div>`,
      },
    ],
  },

  'components-forms-textarea': {
    vanillaHtml: true,
    description: 'Multi-line text input with label, help text, and error state.',
    cssClasses: [
      'mg-form-field',
      'mg-form-label',
      'mg-form-textarea',
      'mg-form-textarea--error',
      'mg-form-textarea--disabled',
      'mg-form-help',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Textarea',
        html: `<div class="mg-form-field">
  <label class="mg-form-label" for="message">Message</label>
  <textarea class="mg-form-textarea" id="message" name="message" rows="5"></textarea>
  <p class="mg-form-help">Max 500 characters.</p>
</div>`,
      },
    ],
  },

  'components-forms-formgroup': {
    vanillaHtml: true,
    description: 'Fieldset wrapper for grouping related form controls with a legend. Error and disabled states.',
    cssClasses: [
      'mg-form-group',
      'mg-form-group--error',
      'mg-form-group--disabled',
      'mg-form-group__legend',
      'mg-form-error',
    ],
    examples: [
      {
        name: 'Form group with radio buttons',
        html: `<fieldset class="mg-form-group">
  <legend class="mg-form-group__legend">What is your role?</legend>
  <div class="mg-form-check">
    <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-1" name="role" value="researcher" />
    <label class="mg-form-check__label" for="role-1">Researcher</label>
  </div>
  <div class="mg-form-check">
    <input class="mg-form-check__input mg-form-check__input--radio" type="radio" id="role-2" name="role" value="practitioner" />
    <label class="mg-form-check__label" for="role-2">Practitioner</label>
  </div>
</fieldset>`,
      },
    ],
  },

  'components-forms-formerrorsummary': {
    vanillaHtml: true,
    description: 'Error summary box listing all form validation errors with anchor links to each field.',
    cssClasses: [
      'mg-form-error-summary',
      'mg-form-error-summary__title',
      'mg-form-error-summary__list',
    ],
    examples: [
      {
        name: 'Form error summary',
        html: `<div class="mg-form-error-summary" role="alert" tabindex="-1">
  <h2 class="mg-form-error-summary__title">There is a problem</h2>
  <ul class="mg-form-error-summary__list">
    <li><a href="#email">Enter a valid email address</a></li>
    <li><a href="#org-name">Organization name is required</a></li>
  </ul>
</div>`,
      },
    ],
  },
};
