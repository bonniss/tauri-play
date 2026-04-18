import { useMantineColorScheme } from '@mantine/core';
import MDEditor from '@uiw/react-md-editor';
import clsx from 'clsx';
import { FunctionComponent } from 'react';

interface MarkdownViewerProps {
  className?: string;
  children?: string | null;
}

const MarkdownViewer: FunctionComponent<MarkdownViewerProps> = ({
  className,
  children,
}) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <div
      className={clsx('prose dark:prose-invert', className)}
      data-color-mode={colorScheme}
    >
      <MDEditor.Markdown source={children || ''} />
    </div>
  );
};

export default MarkdownViewer;
