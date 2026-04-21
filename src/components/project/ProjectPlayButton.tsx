import { Button, type ButtonProps } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { FunctionComponent } from 'react';
import { IconDataPlay } from '~/components/icon/semantic';
import { useAppProvider } from '~/components/layout/AppProvider';
import { useProjectOne } from '~/components/project/ProjectOneProvider';

interface ProjectPlayButtonProps extends ButtonProps {}

const ProjectPlayButton: FunctionComponent<ProjectPlayButtonProps> = ({
  leftSection,
  variant,
  ...props
}) => {
  const { t } = useAppProvider();
  const { projectId } = useProjectOne();

  return (
    <Button
      component={Link}
      leftSection={leftSection ?? <IconDataPlay className="size-4" />}
      params={{ projectId } as never}
      search={{ mode: 'auto' } as never}
      to="/p/$projectId"
      variant={variant ?? 'light'}
      {...props}
    >
      {t('project.play.demoTitle')}
    </Button>
  );
};

export default ProjectPlayButton;
