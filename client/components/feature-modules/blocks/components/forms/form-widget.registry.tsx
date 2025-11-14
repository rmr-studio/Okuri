import { FormWidgetMeta } from "./form-widget.types";
import { TextInputWidget } from "./widgets/text-input-widget";
import { NumberInputWidget } from "./widgets/number-input-widget";
import { CheckboxWidget } from "./widgets/checkbox-widget";
import { RadioButtonWidget } from "./widgets/radio-button-widget";
import { DropdownWidget } from "./widgets/dropdown-widget";
import { DatePickerWidget } from "./widgets/date-picker-widget";
import { EmailInputWidget } from "./widgets/email-input-widget";
import { PhoneInputWidget } from "./widgets/phone-input-widget";
import { CurrencyInputWidget } from "./widgets/currency-input-widget";
import { TextAreaWidget } from "./widgets/textarea-widget";
import { FileUploadWidget } from "./widgets/file-upload-widget";
import { SliderWidget } from "./widgets/slider-widget";
import { ToggleSwitchWidget } from "./widgets/toggle-switch-widget";

/**
 * Registry of form widgets mapped to FormWidgetConfig types
 */
export const formWidgetRegistry: Record<string, FormWidgetMeta> = {
    TEXT_INPUT: {
        type: "TEXT_INPUT",
        component: TextInputWidget,
        defaultValue: "",
    },
    NUMBER_INPUT: {
        type: "NUMBER_INPUT",
        component: NumberInputWidget,
        defaultValue: 0,
    },
    CHECKBOX: {
        type: "CHECKBOX",
        component: CheckboxWidget,
        defaultValue: false,
    },
    RADIO_BUTTON: {
        type: "RADIO_BUTTON",
        component: RadioButtonWidget,
        defaultValue: "",
    },
    DROPDOWN: {
        type: "DROPDOWN",
        component: DropdownWidget,
        defaultValue: "",
    },
    DATE_PICKER: {
        type: "DATE_PICKER",
        component: DatePickerWidget,
        defaultValue: "",
    },
    EMAIL_INPUT: {
        type: "EMAIL_INPUT",
        component: EmailInputWidget,
        defaultValue: "",
    },
    PHONE_INPUT: {
        type: "PHONE_INPUT",
        component: PhoneInputWidget,
        defaultValue: "",
    },
    CURRENCY_INPUT: {
        type: "CURRENCY_INPUT",
        component: CurrencyInputWidget,
        defaultValue: 0,
    },
    TEXT_AREA: {
        type: "TEXT_AREA",
        component: TextAreaWidget,
        defaultValue: "",
    },
    FILE_UPLOAD: {
        type: "FILE_UPLOAD",
        component: FileUploadWidget,
        defaultValue: "",
    },
    SLIDER: {
        type: "SLIDER",
        component: SliderWidget,
        defaultValue: 0,
    },
    TOGGLE_SWITCH: {
        type: "TOGGLE_SWITCH",
        component: ToggleSwitchWidget,
        defaultValue: false,
    },
};
