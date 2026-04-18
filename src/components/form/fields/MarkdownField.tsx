import { Input, useMantineColorScheme } from '@mantine/core';
import MDEditor, { type MDEditorProps } from '@uiw/react-md-editor';
import { FunctionComponent } from 'react';
import { useField } from 'react-headless-form';

interface MarkdownFieldProps extends MDEditorProps {
  placeholder?: string;
}

const MarkdownField: FunctionComponent<MarkdownFieldProps> = (props) => {
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
  } = useField();

  const { colorScheme } = useMantineColorScheme();

  return (
    <Input.Wrapper
      label={label}
      description={description}
      error={errorMessage}
      withAsterisk={required}
    >
      <div className="mt-2" data-color-mode={colorScheme}>
        <MDEditor
          {...props}
          ref={ref}
          id={id}
          value={value ?? ''}
          onChange={(val) => onChange?.(val)}
          textareaProps={{
            placeholder: props.placeholder ?? label,
            readOnly: readOnly,
            disabled: disabled,
          }}
          aria-required={required}
          aria-invalid={Boolean(errorMessage)}
        />
      </div>
    </Input.Wrapper>
  );
};

export default MarkdownField;
