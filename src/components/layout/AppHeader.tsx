import { Button } from '@mantine/core';
import { useHeadroom, useWindowScroll } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { FunctionComponent } from 'react';
import SvgLogo from '../shared/logo/Logo';
import { useAppProvider } from './AppProvider';
import AppSettings from './AppSettings';

interface AppHeaderProps {}

const AppHeader: FunctionComponent<AppHeaderProps> = () => {
  const { t } = useAppProvider();

  const { pinned } = useHeadroom({ fixedAt: 80 });
  const [scroll] = useWindowScroll();
  const isTop = scroll.y < 80;

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 h-[60px] transition-all duration-300',
        isTop
          ? 'bg-transparent border-transparent'
          : 'backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 border-b border-zinc-200/50 dark:border-zinc-800/50',
      )}
      style={{
        transform: `translate3d(0, ${pinned ? 0 : '-110px'}, 0)`,
        transition: 'transform 400ms ease',
      }}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-4">
        <div className="flex items-center gap-4">
          <Button
            component={Link}
            size="compact-sm"
            variant="subtle"
            to="/projects"
          >
            {t('header.projects')}
          </Button>
          <Link to="/" title={t('header.home')}>
            <SvgLogo
              animated
              className={clsx('transition-all', isTop ? 'size-14' : 'size-10')}
            />
          </Link>
          <AppSettings />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
