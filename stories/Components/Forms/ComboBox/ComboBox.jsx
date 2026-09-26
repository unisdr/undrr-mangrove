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
      isInvalid={error === true ? true : undefined}
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
      >
        <ListBox className="mg-combobox__listbox">
          {item => (
            <ListBoxItem
              className="mg-combobox__option"
              id={item.id}
              textValue={item.label}
            >
              {item.label}
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
  name: PropTypes.string,
  className: PropTypes.string,
};

export default ComboBox;
