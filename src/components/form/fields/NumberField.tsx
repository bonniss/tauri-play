import { NumberInput, type NumberInputProps } from "@mantine/core"
import { useField } from "react-headless-form"
import { type FunctionComponent } from "react"

interface NumberFieldProps extends NumberInputProps {}

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
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
    <NumberInput
      {...props}
      ref={ref}
      id={id}
      label={label}
      description={description}
      error={errorMessage}
      hideControls={props.hideControls ?? false}
      value={value ?? ""}
      onChange={(nextValue) => onChange?.(nextValue === "" ? "" : String(nextValue))}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-required={required}
      aria-invalid={Boolean(errorMessage)}
    />
  )
}

export default NumberField
