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
} from 'react-aria-components';

const EMPTY_ITEMS = [];

export function ComboBox({
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
    <AriaComboBox
      className={['mg-combobox', className].filter(Boolean).join(' ')}
      defaultItems={items}
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
      <Label className="mg-combobox__label">{label}</Label>
      <div className="mg-combobox__control">
        <Input className="mg-combobox__input" placeholder={placeholder} />
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
      {errorText && (
        <FieldError className="mg-combobox__error">{errorText}</FieldError>
      )}
    </AriaComboBox>
  );
}

ComboBox.propTypes = {
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

export default ComboBox;
