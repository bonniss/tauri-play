import { FunctionComponent } from 'react';
import { Paper } from '@mantine/core';
import { useAppProvider } from '../layout/AppProvider';

const HomeLiveDemo: FunctionComponent = () => {
  const { t } = useAppProvider();

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <Paper
        // className="overflow-hidden rounded-[28px] border-zinc-200/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(244,244,245,0.96)_42%,rgba(255,255,255,0.98))] p-4 shadow-[0_24px_80px_-48px_rgba(24,24,27,0.45)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.92),rgba(24,24,27,0.96)_42%,rgba(9,9,11,0.98))] md:p-6"
        // radius="xl"
        // withBorder
      >
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,560px)] lg:gap-10">
          <div className="max-w-xl space-y-4 px-2 py-2 md:px-4">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-4xl">
              {t('home.liveDemo.title')}
            </h2>
            <p className="max-w-lg text-base leading-7 text-zinc-600 dark:text-zinc-300 md:text-lg">
              {t('home.liveDemo.description')}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-zinc-200/80 bg-zinc-950 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.75)] dark:border-zinc-700/80">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/30 to-transparent" />
            <video
              aria-label={t('home.liveDemo.title')}
              autoPlay
              className="w-full object-contain"
              loop
              muted
              playsInline
              preload="metadata"
              src="/example/plantml-live.mp4"
            />
          </div>
        </div>
      </Paper>
    </section>
  );
};

export default HomeLiveDemo;
