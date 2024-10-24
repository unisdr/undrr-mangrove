import React from "react";

export function Checkbox({ label, value, arialabel, id, label_pos }) {
    return (
      <>
        <div className="dts-form-field">
          {/* Add aria-invalid="true" attribute to label tag when the field has ERRORS */}
          <label aria-invalid="true">
              {/* Add disabled attribute to the input tag to make it DISABLED */}
              {/* Add  aria-describedBy="inputErrorId" attribute to the input tag when the field has ERRORS */}
              <input type="checkbox" name="" aria-describedBy="inputErrorId" />
              <span>Checkbox label</span>
          </label>
          <span className="dts-form-field__error-msg" id="inputErrorId" aria-live="assertive">
              Error message goes here
          </span>
        </div>
      </>
    );
}
