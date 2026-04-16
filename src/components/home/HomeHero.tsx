import { Button } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconArrowRight } from '@tabler/icons-react';
import { FunctionComponent } from 'react';
import antlerDeer from '~/assets/animals/antler-deer.svg';
import bear from '~/assets/animals/bear.svg';
import crocodile from '~/assets/animals/crocodile.svg';
import elephant from '~/assets/animals/elephant.svg';
import kangaroo from '~/assets/animals/kangaroo.svg';
import tiger from '~/assets/animals/tiger.svg';

const heroAnimals = [
  {
    accent: 'from-emerald-300/85 to-teal-200/55',
    confidence: '98.1%',
    image: tiger,
    label: 'Tiger',
    position: 'left-[4%] top-[8%] z-20',
    scoreColor: 'text-emerald-500 dark:text-emerald-300',
    size: 'w-[182px]',
    style: {
      ['--drift-duration' as string]: '10s',
      ['--drift-x' as string]: '10px',
      ['--drift-y' as string]: '-12px',
      ['--float-duration' as string]: '7.5s',
      ['--float-rotate' as string]: '-8deg',
      ['--float-tilt' as string]: '2deg',
      ['--float-y' as string]: '-14px',
    },
  },
  {
    accent: 'from-sky-300/80 to-cyan-200/55',
    confidence: '96.7%',
    image: elephant,
    label: 'Elephant',
    position: 'right-[8%] top-[10%] z-10',
    scoreColor: 'text-sky-500 dark:text-sky-300',
    size: 'w-[176px]',
    style: {
      ['--drift-duration' as string]: '11.4s',
      ['--drift-x' as string]: '-10px',
      ['--drift-y' as string]: '-8px',
      ['--float-duration' as string]: '8.6s',
      ['--float-rotate' as string]: '9deg',
      ['--float-tilt' as string]: '-2deg',
      ['--float-y' as string]: '-12px',
    },
  },
  {
    accent: 'from-amber-300/80 to-orange-200/55',
    confidence: '95.3%',
    image: antlerDeer,
    label: 'Deer',
    position: 'left-[18%] top-[42%] z-30',
    scoreColor: 'text-amber-500 dark:text-amber-300',
    size: 'w-[168px]',
    style: {
      ['--drift-duration' as string]: '9.6s',
      ['--drift-x' as string]: '8px',
      ['--drift-y' as string]: '-12px',
      ['--float-duration' as string]: '6.9s',
      ['--float-rotate' as string]: '-4deg',
      ['--float-tilt' as string]: '2deg',
      ['--float-y' as string]: '-16px',
    },
  },
  {
    accent: 'from-fuchsia-300/75 to-violet-200/50',
    confidence: '93.9%',
    image: kangaroo,
    label: 'Kangaroo',
    position: 'right-[20%] top-[54%] z-20',
    scoreColor: 'text-fuchsia-500 dark:text-fuchsia-300',
    size: 'w-[160px]',
    style: {
      ['--drift-duration' as string]: '12s',
      ['--drift-x' as string]: '-8px',
      ['--drift-y' as string]: '-10px',
      ['--float-duration' as string]: '8.2s',
      ['--float-rotate' as string]: '6deg',
      ['--float-tilt' as string]: '-2deg',
      ['--float-y' as string]: '-14px',
    },
  },
  {
    accent: 'from-rose-300/75 to-pink-200/50',
    confidence: '91.4%',
    image: crocodile,
    label: 'Crocodile',
    position: 'right-[0%] top-[34%] z-20',
    scoreColor: 'text-rose-500 dark:text-rose-300',
    size: 'w-[150px]',
    style: {
      ['--drift-duration' as string]: '13s',
      ['--drift-x' as string]: '-12px',
      ['--drift-y' as string]: '-6px',
      ['--float-duration' as string]: '9.8s',
      ['--float-rotate' as string]: '12deg',
      ['--float-tilt' as string]: '-3deg',
      ['--float-y' as string]: '-10px',
    },
  },
  {
    accent: 'from-zinc-300/80 to-stone-200/55',
    confidence: '89.8%',
    image: bear,
    label: 'Bear',
    position: 'left-[2%] top-[60%] z-10',
    scoreColor: 'text-zinc-500 dark:text-zinc-300',
    size: 'w-[148px]',
    style: {
      ['--drift-duration' as string]: '10.8s',
      ['--drift-x' as string]: '10px',
      ['--drift-y' as string]: '-8px',
      ['--float-duration' as string]: '7.9s',
      ['--float-rotate' as string]: '-10deg',
      ['--float-tilt' as string]: '2deg',
      ['--float-y' as string]: '-12px',
    },
  },
] as const;

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

        <div className="relative min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/35 via-sky-200/20 to-transparent blur-3xl dark:from-emerald-500/12 dark:via-sky-500/10" />
          <div className="relative h-full min-h-[460px]">
            <div className="pointer-events-none absolute inset-x-[-16%] bottom-[-8%] top-[2%] [perspective:1200px]">
              <div className="absolute inset-0 origin-bottom [transform:rotateX(72deg)]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.10)_1px,transparent_1px)] bg-[size:38px_38px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.10)_1px,transparent_1px)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_55%)] dark:bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.18),transparent_55%)]" />
              </div>
            </div>
            {heroAnimals.map((animal) => (
              <div
                className={`home-hero-drift home-hero-float absolute ${animal.position} ${animal.size}`}
                key={animal.label}
                style={animal.style}
              >
                <div className="relative rounded-[28px] border border-white/55 bg-white/88 p-3 shadow-[0_22px_54px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/72 dark:shadow-[0_22px_54px_rgba(0,0,0,0.38)]">
                  <div className={`absolute inset-x-3 top-3 h-24 rounded-[22px] bg-gradient-to-br ${animal.accent} opacity-80 blur-xl`} />
                  <div className="relative overflow-hidden rounded-[24px] p-4">
                    <img
                      alt={animal.label}
                      className="mx-auto h-28 w-full object-contain drop-shadow-[0_18px_24px_rgba(15,23,42,0.16)]"
                      src={animal.image}
                    />
                  </div>
                  <div className="relative mt-2 px-2 pb-1">
                    <div className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {animal.label}
                    </div>
                  </div>
                  <div
                    className={`pointer-events-none absolute -bottom-3 right-3 text-3xl font-semibold tracking-tight ${animal.scoreColor} opacity-95`}
                  >
                    {animal.confidence}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
