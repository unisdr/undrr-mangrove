/** A React-only Combobox using Mangrove's control roles and React Aria behaviour. */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  ComboBox,
  FieldError,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from 'react-aria-components';

const EMPTY_ITEMS = [];

export function AriaComboBox({
  label,
  items = EMPTY_ITEMS,
  placeholder,
  inputValue,
  onInputChange,
  selectedKey,
  onSelectionChange,
  allowsCustomValue = false,
  isRequired = false,
  isDisabled = false,
  isInvalid = false,
  errorText,
  openButtonLabel = 'Show suggestions',
  popoverContainer,
  name,
  className,
}) {
  return (
    <ComboBox
      className={['mg-aria-combobox', className].filter(Boolean).join(' ')}
      items={items}
      inputValue={inputValue}
      onInputChange={onInputChange}
      selectedKey={selectedKey}
      onSelectionChange={onSelectionChange}
      allowsCustomValue={allowsCustomValue}
      isRequired={isRequired}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
      name={name}
    >
      <Label className="mg-aria-combobox__label">{label}</Label>
      <div className="mg-aria-combobox__control">
        <Input className="mg-aria-combobox__input" placeholder={placeholder} />
        <Button
          className="mg-aria-combobox__trigger"
          aria-label={openButtonLabel}
        >
          <span aria-hidden="true">▾</span>
        </Button>
      </div>
      <Popover
        className="mg-aria-combobox__popover"
        UNSTABLE_portalContainer={popoverContainer}
      >
        <ListBox className="mg-aria-combobox__listbox" items={items}>
          {item => (
            <ListBoxItem
              className="mg-aria-combobox__option"
              id={item.id}
              textValue={item.label}
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
      {errorText && (
        <FieldError className="mg-aria-combobox__error">{errorText}</FieldError>
      )}
    </ComboBox>
  );
}

AriaComboBox.propTypes = {
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  selectedKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectionChange: PropTypes.func,
  allowsCustomValue: PropTypes.bool,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isInvalid: PropTypes.bool,
  errorText: PropTypes.string,
  openButtonLabel: PropTypes.string,
  popoverContainer: PropTypes.object,
  name: PropTypes.string,
  className: PropTypes.string,
};

export default AriaComboBox;
