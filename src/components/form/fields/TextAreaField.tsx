import { useField } from "react-headless-form"
import { Textarea, type TextareaProps } from "@mantine/core"
import { type FunctionComponent } from "react"

interface TextAreaFieldProps extends TextareaProps {}

const TextAreaField: FunctionComponent<TextAreaFieldProps> = (props) => {
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
    <Textarea
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

export default TextAreaField
