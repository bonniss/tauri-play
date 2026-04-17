import { defineMapping, setupForm } from "react-headless-form"
import { t } from "~/lib/i18n"
import InputField from "./fields/InputField"
import MarkdownField from "./fields/MarkdownField"
import NumberField from "./fields/NumberField"
import RadioField from "./fields/RadioField"
import SwitchField from "./fields/SwitchField"

export const [Form, defineConfig] = setupForm({
  fieldMapping: defineMapping({
    text: InputField,
    numeric: NumberField,
    longText: MarkdownField,
    switch: SwitchField,
    radio: RadioField,
  }),
  i18nConfig: {
    t: (message, params) =>
      t(message, {
        params: params as Record<string, string | number> | undefined,
        fallback: message,
      }),
  },
})
