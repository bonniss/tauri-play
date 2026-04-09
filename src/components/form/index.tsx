import { setupForm, defineMapping } from "react-headless-form"
import InputField from "./fields/InputField"
import TextAreaField from "./fields/TextAreaField"
import SwitchField from "./fields/SwitchField"
import RadioField from "./fields/RadioField"

export const [Form, defineConfig] = setupForm({
  fieldMapping: defineMapping({
    text: InputField,
    longText: TextAreaField,
    switch: SwitchField,
    radio: RadioField,
  }),
})
