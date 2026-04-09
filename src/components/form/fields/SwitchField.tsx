import { Switch, type SwitchProps } from "@mantine/core"
import { type FunctionComponent } from "react"
import { useField } from "react-headless-form"

interface SwitchFieldProps extends Omit<SwitchProps, "checked" | "defaultChecked"> {}

const SwitchField: FunctionComponent<SwitchFieldProps> = (props) => {
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
    ref,
  } = useField()

  return (
    <Switch
      {...props}
      ref={ref}
      checked={Boolean(value)}
      description={description}
      disabled={disabled}
      error={errorMessage}
      id={id}
      label={label}
      onChange={(event) => onChange?.(event.currentTarget.checked)}
      readOnly={readOnly}
      required={required}
      aria-invalid={Boolean(errorMessage)}
      aria-required={required}
    />
  )
}

export default SwitchField
