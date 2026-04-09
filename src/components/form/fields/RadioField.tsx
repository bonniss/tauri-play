import { Radio, type RadioGroupProps } from "@mantine/core"
import { type FunctionComponent } from "react"
import { useField } from "react-headless-form"

interface RadioFieldOption {
  description?: string
  disabled?: boolean
  label: string
  value: string
}

interface RadioFieldProps
  extends Omit<
    RadioGroupProps,
    "children" | "defaultValue" | "description" | "error" | "label" | "onChange" | "value"
  > {
  options: RadioFieldOption[]
}

const RadioField: FunctionComponent<RadioFieldProps> = ({ options, ...props }) => {
  const {
    id,
    value,
    onChange,
    errorMessage,
    label,
    description,
    required,
    disabled,
    readOnly,
  } = useField()

  return (
    <Radio.Group
      {...props}
      description={description}
      error={errorMessage}
      id={id}
      label={label}
      onChange={(nextValue) => onChange?.(nextValue)}
      value={typeof value === "string" ? value : ""}
      withAsterisk={required}
      aria-invalid={Boolean(errorMessage)}
      aria-required={required}
    >
      {options.map((option) => (
        <Radio
          description={option.description}
          disabled={disabled || readOnly || option.disabled}
          key={option.value}
          label={option.label}
          value={option.value}
        />
      ))}
    </Radio.Group>
  )
}

export default RadioField
