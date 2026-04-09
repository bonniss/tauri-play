import { useField } from "react-headless-form"
import { type FunctionComponent } from "react"
import { TextInput, type TextInputProps } from "@mantine/core"

interface InputFieldProps extends TextInputProps {}

const InputField: FunctionComponent<InputFieldProps> = (props) => {
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
    <TextInput
      {...props}
      ref={ref}
      id={id}
      label={label}
      description={description}
      error={errorMessage}
      withAsterisk={required}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={props.placeholder ?? label}
      aria-required={required}
      aria-invalid={Boolean(errorMessage)}
    />
  )
}

export default InputField
