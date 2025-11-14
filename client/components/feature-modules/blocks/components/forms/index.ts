/**
 * Block Editing System - Main Exports
 */

// Core components
export { BlockForm } from "./block-form";
export { BlockEditDrawer } from "./block-edit-drawer";
export { EditModeIndicator } from "./edit-mode-indicator";

// Form widget types
export type { FormWidgetProps, FormWidgetMeta } from "./form-widget.types";

// Form widget registry
export { formWidgetRegistry } from "./form-widget.registry";

// Individual widgets (for custom usage)
export { TextInputWidget } from "./widgets/text-input-widget";
export { NumberInputWidget } from "./widgets/number-input-widget";
export { EmailInputWidget } from "./widgets/email-input-widget";
export { PhoneInputWidget } from "./widgets/phone-input-widget";
export { CurrencyInputWidget } from "./widgets/currency-input-widget";
export { TextAreaWidget } from "./widgets/textarea-widget";
export { CheckboxWidget } from "./widgets/checkbox-widget";
export { ToggleSwitchWidget } from "./widgets/toggle-switch-widget";
export { RadioButtonWidget } from "./widgets/radio-button-widget";
export { DropdownWidget } from "./widgets/dropdown-widget";
export { DatePickerWidget } from "./widgets/date-picker-widget";
export { SliderWidget } from "./widgets/slider-widget";
export { FileUploadWidget } from "./widgets/file-upload-widget";
