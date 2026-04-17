import { Group, Radio, type RadioGroupProps, Stack } from '@mantine/core';
import { type FunctionComponent } from 'react';
import { useField } from 'react-headless-form';

interface RadioFieldOption {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
}

interface RadioFieldProps extends Omit<
  RadioGroupProps,
  | 'children'
  | 'defaultValue'
  | 'description'
  | 'error'
  | 'label'
  | 'onChange'
  | 'value'
> {
  options: RadioFieldOption[];
  orientation?: 'vertical' | 'horizontal';
  gap?: number | string;
  wrap?: boolean;
}

const RadioField: FunctionComponent<RadioFieldProps> = ({
  options,
  orientation = 'vertical',
  gap = 'sm',
  wrap = true,
  ...props
}) => {
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
  } = useField();

  const items = options.map((option) => (
    <Radio
      key={option.value}
      value={option.value}
      label={option.label}
      description={option.description}
      disabled={disabled || readOnly || option.disabled}
    />
  ));

  return (
    <Radio.Group
      {...props}
      id={id}
      label={label}
      description={description}
      error={errorMessage}
      value={typeof value === 'string' ? value : ''}
      onChange={(nextValue) => onChange?.(nextValue)}
      withAsterisk={required}
      aria-invalid={Boolean(errorMessage)}
      aria-required={required}
    >
      {orientation === 'horizontal' ? (
        <Group gap={gap} wrap={wrap ? 'wrap' : undefined}>
          {items}
        </Group>
      ) : (
        <Stack gap={gap}>{items}</Stack>
      )}
    </Radio.Group>
  );
};

export default RadioField;
