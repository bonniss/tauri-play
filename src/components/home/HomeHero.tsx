import { Button } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconArrowRight } from '@tabler/icons-react';
import { FunctionComponent } from 'react';

const HomeHero: FunctionComponent = () => {
  return (
    <section className="relative left-1/2 mt-[-60px] w-screen -translate-x-1/2 py-16 pt-[108px]">
      <div className="pointer-events-none absolute inset-x-0 -top-32 bottom-0">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-emerald-300/35 blur-[120px] dark:bg-emerald-500/22" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-sky-300/28 blur-[140px] dark:bg-sky-500/18" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-amber-200/30 blur-[140px] dark:bg-amber-400/14" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="space-y-5 lg:max-w-3xl">
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl dark:text-zinc-50">
              Teach your model with your own images, then test it live.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
              Collect examples, organize classes, train locally, and open a playable
              experience without leaving the app.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              component={Link}
              search={{ create: true } as never}
              rightSection={<IconArrowRight className="size-4" />}
              size="md"
              to="/projects"
            >
              Get Started
            </Button>
          </div>
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/35 via-sky-200/20 to-transparent blur-3xl dark:from-emerald-500/12 dark:via-sky-500/10" />
          <div className="relative h-full min-h-[420px] overflow-hidden">
            <div className="pointer-events-none absolute inset-x-[-16%] bottom-[-8%] top-[2%] [perspective:1200px]">
              <div className="absolute inset-0 origin-bottom [transform:rotateX(72deg)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.10)_1px,transparent_1px)] bg-[size:38px_38px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_55%)]" />
              </div>
            </div>
            <div className="absolute left-10 top-10 rounded-full border border-emerald-400/30 bg-white/60 px-3 py-1 text-xs text-emerald-700 backdrop-blur-sm dark:bg-emerald-400/10 dark:text-emerald-200">
              Capture
            </div>
            <div className="absolute right-10 top-16 rounded-full border border-sky-400/30 bg-white/60 px-3 py-1 text-xs text-sky-700 backdrop-blur-sm dark:bg-sky-400/10 dark:text-sky-200">
              Train
            </div>
            <div className="absolute left-12 top-24 h-28 w-24 rounded-2xl border border-white/20 bg-white/40 shadow-[0_16px_40px_rgba(0,0,0,0.15)] backdrop-blur-md [transform:translateY(0px)_rotate(-8deg)] dark:bg-white/5 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />
            <div className="absolute right-16 top-28 h-32 w-24 rounded-2xl border border-white/20 bg-white/40 shadow-[0_16px_40px_rgba(0,0,0,0.15)] backdrop-blur-md [transform:translateY(0px)_rotate(10deg)] dark:bg-white/5 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />
            <div className="absolute bottom-12 left-10 right-10 rounded-3xl border border-white/20 bg-white/55 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-500 dark:text-white/50">Top Prediction</div>
                    <div className="text-2xl font-semibold text-zinc-950 dark:text-white">Golden Retriever</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-200">
                    97.4%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10">
                    <div className="h-2 w-[82%] rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10">
                    <div className="h-2 w-[42%] rounded-full bg-sky-400" />
                  </div>
                  <div className="h-2 rounded-full bg-zinc-200 dark:bg-white/10">
                    <div className="h-2 w-[18%] rounded-full bg-amber-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
