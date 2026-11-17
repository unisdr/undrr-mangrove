/**
 * @license Check glyph: Lucide Check, ISC License, copyright (c) 2026 Lucide Icons and Contributors.
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */
/** A React-only Combobox using Mangrove's control roles and React Aria behaviour. */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ComboBox as AriaComboBox,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
} from 'react-aria-components';

const EMPTY_ITEMS = [];

export function ComboBox({
  label,
  id,
  hideLabel = false,
  items = EMPTY_ITEMS,
  placeholder,
  inputValue,
  defaultInputValue,
  onInputChange,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  allowsCustomValue = false,
  required = false,
  disabled = false,
  error,
  helpText,
  errorText,
  openButtonLabel = 'Show suggestions',
  popoverContainer,
  popoverOffset = 8,
  name,
  className,
}) {
  return (
    <AriaComboBox
      className={['mg-combobox', className].filter(Boolean).join(' ')}
      defaultItems={items}
      inputValue={inputValue}
      defaultInputValue={defaultInputValue}
      onInputChange={onInputChange}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      onSelectionChange={onSelectionChange}
      allowsCustomValue={allowsCustomValue}
      isRequired={required}
      isDisabled={disabled}
      isInvalid={error}
      name={name}
    >
      <Label
        className={[
          'mg-combobox__label',
          hideLabel && 'mg-u-sr-only',
          required && 'mg-form-label--required',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </Label>
      <div className="mg-combobox__control">
        <Input
          id={id}
          className="mg-combobox__input"
          placeholder={placeholder}
        />
        <Button className="mg-combobox__trigger" aria-label={openButtonLabel}>
          <span aria-hidden="true">▾</span>
        </Button>
      </div>
      <Popover
        className="mg-combobox__popover"
        UNSTABLE_portalContainer={popoverContainer}
        offset={popoverOffset}
      >
        <ListBox className="mg-combobox__listbox">
          {item => (
            <ListBoxItem
              className="mg-combobox__option"
              id={item.id}
              textValue={item.label}
            >
              {({ isSelected }) => (
                <>
                  <Text slot="label">{item.label}</Text>
                  <span className="mg-combobox__selection" aria-hidden="true">
                    {isSelected && (
                      <svg
                        className="mg-combobox__check"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
      {helpText && (
        <Text slot="description" className="mg-form-help">
          {helpText}
        </Text>
      )}
      {errorText && (
        <FieldError className="mg-combobox__error">{errorText}</FieldError>
      )}
    </AriaComboBox>
  );
}

ComboBox.propTypes = {
  label: PropTypes.string.isRequired,
  id: PropTypes.string,
  hideLabel: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  inputValue: PropTypes.string,
  defaultInputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  selectedKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultSelectedKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectionChange: PropTypes.func,
  allowsCustomValue: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helpText: PropTypes.string,
  errorText: PropTypes.string,
  openButtonLabel: PropTypes.string,
  popoverContainer: PropTypes.object,
  popoverOffset: PropTypes.number,
  name: PropTypes.string,
  className: PropTypes.string,
};

export default ComboBox;
