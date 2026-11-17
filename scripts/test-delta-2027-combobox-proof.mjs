/** Isolated #1088 + Delta 2027 integration acceptance checks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import axe from 'axe-core';

const base = process.env.COMBOBOX_PROOF_URL || 'http://127.0.0.1:6103';
const output = 'docs/review/delta-2027-combobox';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const deadline = setTimeout(() => {
  console.error('ComboBox integration proof exceeded two minutes');
  browser.close().finally(() => process.exit(1));
}, 120_000);
const style = (locator, property) =>
  locator.evaluate((node, prop) => getComputedStyle(node)[prop], property);
const url = (mode, rtl = false) => {
  const result = new URL('iframe.html', `${base.replace(/\/$/, '')}/`);
  result.searchParams.set(
    'id',
    `example-delta-2027-combobox-proof--${mode}-theme`
  );
  result.searchParams.set('viewMode', 'story');
  if (rtl) result.searchParams.set('globals', 'addonRtl:rtl');
  return result.href;
};
const scanAccessibility = async page => {
  // Keep this explicit run independent of Storybook's background a11y addon.
  if (!(await page.evaluate(() => Boolean(window.__mgComboBoxProofAxe)))) {
    await page.addScriptTag({
      content: `{ const previousAxe = window.axe;\n${axe.source}\nwindow.__mgComboBoxProofAxe = window.axe; window.axe = previousAxe; }`,
    });
  }
  return page.evaluate(async () =>
    (
      await window.__mgComboBoxProofAxe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      })
    ).violations.map(item => ({
      id: item.id,
      impact: item.impact,
      targets: item.nodes.map(node => node.target),
    }))
  );
};
const expectAccessible = async page =>
  assert.deepEqual(
    await scanAccessibility(page),
    [],
    'Closed ComboBox example must pass the selected axe WCAG A/AA rules'
  );
const openFindings = [];
const checkOutsideFocus = async (page, input, invalid, mode) => {
  const violations = await scanAccessibility(page);
  assert.deepEqual(
    violations.filter(item => item.id !== 'aria-hidden-focus'),
    [],
    'Unexpected open-popup axe findings'
  );
  assert.equal(
    await page.evaluate(
      targets =>
        targets.every(path => {
          if (path.length !== 1) return false;
          const node = document.querySelector(path[0]);
          return Boolean(
            node?.matches('.mg-combobox[data-invalid]') ||
            node?.closest('.mg-combobox[data-invalid]')
          );
        }),
      violations.flatMap(item => item.targets)
    ),
    true,
    'Only the known outside-field finding may be recorded'
  );
  const hiddenWhileOpen = await invalid.evaluate(node =>
    Boolean(node.closest('[aria-hidden="true"]'))
  );
  await page.evaluate(() => {
    window.__proofOutsideFocus = [];
    document.addEventListener(
      'focusin',
      event => {
        if (event.target.closest('.mg-combobox[data-invalid]'))
          window.__proofOutsideFocus.push({
            hiddenAtFocus: Boolean(
              event.target.closest('[aria-hidden="true"]')
            ),
          });
      },
      { capture: true }
    );
  });
  await input.press('Tab');
  await page.locator('.mg-combobox__popover').waitFor({ state: 'hidden' });
  assert.equal(
    await invalid.evaluate(node => node === document.activeElement),
    true,
    'Tab must reach the next enabled field'
  );
  assert.equal(
    await invalid.evaluate(node =>
      Boolean(node.closest('[aria-hidden="true"]'))
    ),
    false,
    'The focused field must not remain hidden from assistive technology'
  );
  await expectAccessible(page);
  const focusEvents = await page.evaluate(() => window.__proofOutsideFocus);
  assert.ok(focusEvents.length > 0, 'Outside focus must be observed');
  assert.equal(
    focusEvents[0].hiddenAtFocus,
    false,
    'The next field must already be exposed when it receives focus'
  );
  openFindings.push({
    focusEvents,
    mode,
    violations,
    hiddenWhileOpen,
    afterTab:
      'popup closed; next field focused and not aria-hidden; closed-state axe passes',
  });
};
const evidence = [];
try {
  for (const mode of ['body', 'wrapper']) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 800 },
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url(mode));
    const input = page.getByRole('combobox', {
      name: 'Hazard type',
      exact: true,
    });
    await input.waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await input.inputValue(), 'Flood');
    assert.equal(await style(input, 'height'), '32px');
    assert.match(await style(input, 'fontFamily'), /Inter/);
    const disabled = page.getByRole('combobox', {
      name: 'Disabled hazard',
      exact: true,
    });
    assert.equal(await disabled.isDisabled(), true);
    assert.equal(await style(disabled.locator('xpath=../..'), 'opacity'), '1');
    assert.equal(
      await style(disabled, 'backgroundColor'),
      'rgb(240, 238, 230)'
    );
    assert.equal(await style(disabled, 'color'), 'rgb(155, 163, 184)');
    const invalid = page.locator(
      '.mg-combobox[data-invalid] .mg-combobox__input'
    );
    assert.equal(await invalid.getAttribute('aria-invalid'), 'true');
    assert.equal(await style(invalid, 'borderTopColor'), 'rgb(200, 53, 42)');
    assert.equal(
      await style(page.locator('.mg-combobox__error'), 'color'),
      'rgb(200, 53, 42)'
    );
    await expectAccessible(page);
    await page.keyboard.press('Tab');
    await input.focus();
    assert.equal(
      await input.evaluate(node => node.matches('[data-focus-visible]')),
      true
    );
    assert.match(await style(input, 'boxShadow'), /inset/);
    await page.getByRole('button', { name: /^Show hazards/ }).click();
    const list = page.getByRole('listbox');
    await list.waitFor();
    const selected = page.getByRole('option', { name: 'Flood', exact: true });
    assert.equal(await selected.getAttribute('aria-selected'), 'true');
    assert.equal(await style(selected, 'backgroundColor'), 'rgba(0, 0, 0, 0)');
    assert.equal(await style(selected, 'fontWeight'), '400');
    assert.equal(await style(selected, 'color'), 'rgb(20, 20, 19)');
    assert.equal(
      await selected
        .locator('.mg-combobox__selection .mg-combobox__check')
        .isVisible(),
      true
    );
    assert.equal(
      await page.locator('.mg-combobox__selection .mg-combobox__check').count(),
      1
    );
    const popup = page.locator('.mg-combobox__popover');
    assert.equal(await style(popup, 'backgroundColor'), 'rgb(255, 255, 255)');
    assert.match(await style(popup, 'fontFamily'), /Inter/);
    assert.equal(await style(popup, 'borderRadius'), '12px');
    assert.equal(
      await popup.evaluate(node =>
        Boolean(node.closest('[data-proof-wrapper]'))
      ),
      mode === 'wrapper'
    );
    assert.equal(
      await page
        .locator('body')
        .evaluate(node => node.classList.contains('mg-theme-delta-2027')),
      mode === 'body'
    );
    await checkOutsideFocus(page, input, invalid, mode);
    await page.getByRole('button', { name: /^Show hazards/ }).click();
    await selected.waitFor();
    const boundary =
      mode === 'body'
        ? page.locator('body')
        : page.locator('[data-proof-wrapper]');
    await boundary.evaluate(node => {
      node.style.setProperty(
        '--mg-delta-2027-typography-weight-regular',
        '500'
      );
      node.style.setProperty(
        '--mg-delta-2027-typography-line-height-tight',
        '1.5'
      );
      node.style.setProperty('--mg-delta-2027-spacing-3', '16px');
    });
    assert.equal(await style(selected, 'fontWeight'), '500');
    assert.equal(await style(input, 'lineHeight'), '21px');
    assert.equal(await style(input, 'paddingInlineStart'), '16px');
    await boundary.evaluate(node => {
      for (const property of [
        '--mg-delta-2027-typography-weight-regular',
        '--mg-delta-2027-typography-line-height-tight',
        '--mg-delta-2027-spacing-3',
      ])
        node.style.removeProperty(property);
    });
    await page.screenshot({ path: `${output}/${mode}-popup.png` });
    await input.press('ArrowDown');
    const focusedOption = page.locator('.mg-combobox__option[data-focused]');
    assert.match(await style(focusedOption, 'boxShadow'), /inset/);
    await input.press('Enter');
    await page.waitForFunction(
      () => document.querySelector('.mg-combobox__input')?.value === 'Storm'
    );
    assert.equal(await input.inputValue(), 'Storm');
    assert.match(await page.getByRole('status').textContent(), /storm/);
    await page.getByRole('button', { name: /^Show hazards/ }).click();
    await page.getByRole('option', { name: 'Storm', exact: true }).waitFor();
    await input.press('Escape');
    assert.equal(await popup.count(), 0);
    await input.fill('dro');
    await input.press('ArrowDown');
    await page.getByRole('option', { name: 'Drought', exact: true }).waitFor();
    assert.equal(await page.getByRole('option').count(), 1);
    await input.press('ArrowDown');
    await input.press('Enter');
    await page.waitForFunction(
      () => document.querySelector('.mg-combobox__input')?.value === 'Drought'
    );
    assert.equal(await input.inputValue(), 'Drought');
    assert.equal(errors.length, 0, errors.join('\n'));
    evidence.push({
      mode,
      selectedIndicator: 'check only',
      keyboard: 'selection/filter/Escape',
      portal: mode === 'body' ? 'document body' : 'explicit themed wrapper',
    });

    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await input.focus();
    assert.equal(await style(input, 'outlineStyle'), 'solid');
    await page.waitForFunction(
      () =>
        matchMedia('(forced-colors: active)').matches &&
        parseFloat(
          getComputedStyle(document.querySelector('.mg-combobox__input'))
            .outlineWidth
        ) >= 2
    );
    assert.ok(parseFloat(await style(input, 'outlineWidth')) >= 2);
    assert.equal(await input.isEditable(), true);
    await page.getByRole('button', { name: /^Show hazards/ }).click();
    await page.getByRole('option', { name: 'Drought', exact: true }).waitFor();
    await page.screenshot({ path: `${output}/${mode}-forced-colours.png` });
    await page.close();

    const rtl = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await rtl.goto(url(mode, true));
    const rtlInput = rtl.getByRole('combobox', {
      name: 'Hazard type',
      exact: true,
    });
    await rtlInput.waitFor();
    assert.equal(await style(rtlInput, 'direction'), 'rtl');
    await rtl.getByRole('button', { name: /^Show hazards/ }).click();
    const rtlPopup = rtl.locator('.mg-combobox__popover');
    await rtlPopup.waitFor();
    assert.equal(await style(rtlPopup, 'direction'), 'rtl');
    const rect = await rtlPopup.boundingBox();
    assert.ok(
      rect.x >= -1 && rect.x + rect.width <= 391,
      `RTL popup outside viewport: ${JSON.stringify(rect)}`
    );
    assert.equal(
      await rtl.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1
      ),
      true
    );
    await rtl.screenshot({ path: `${output}/${mode}-mobile-rtl.png` });
    await rtl.close();
  }
  const reference = await browser.newPage();
  const referenceUrl = new URL('iframe.html', `${base.replace(/\/$/, '')}/`);
  referenceUrl.searchParams.set(
    'id',
    'example-delta-2027-combobox-proof--pilot-reference'
  );
  referenceUrl.searchParams.set('viewMode', 'story');
  await reference.goto(referenceUrl.href);
  const referenceInput = reference.getByRole('combobox', {
    name: 'Hazard type',
    exact: true,
  });
  await referenceInput.waitFor();
  await expectAccessible(reference);
  await reference.getByRole('button', { name: /^Show hazards/ }).click();
  await reference.getByRole('listbox').waitFor();
  await checkOutsideFocus(
    reference,
    referenceInput,
    reference.locator('.mg-combobox[data-invalid] .mg-combobox__input'),
    'unmodified #1088 body portal'
  );
  await reference.close();
  fs.writeFileSync(
    `${output}/axe-open-findings.json`,
    `${JSON.stringify(openFindings, null, 2)}\n`
  );
  console.warn(
    'Open-popup axe findings are retained in axe-open-findings.json; native Tab dismissal restores the next field before the focused-state assertion. Physical screen-reader review remains open.'
  );
  console.log(JSON.stringify(evidence, null, 2));
  console.log(
    'ComboBox proof passed: body and wrapper portal inheritance, checkmark-only selection, inset focus, explicit disabled colours, filtering, keyboard selection/Escape, forced colours with reduced motion, and mobile RTL.'
  );
} finally {
  clearTimeout(deadline);
  await browser.close();
}
