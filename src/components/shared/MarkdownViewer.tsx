import { useMantineColorScheme } from '@mantine/core';
import clsx from 'clsx';
import { FunctionComponent } from 'react';
import Markdown from 'react-markdown';

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
      <Markdown>{children || ''}</Markdown>
    </div>
  );
};

export default MarkdownViewer;
