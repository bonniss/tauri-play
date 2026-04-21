import { Button } from '@mantine/core';
import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FunctionComponent, startTransition } from 'react';
import { toast } from 'sonner';
import { importProject } from '~/lib/project/project-import';
import { IconDataLabel, IconDataTrain } from '../icon/semantic';
import { useAppProvider } from '../layout/AppProvider';

// ─── Step 1: Collect ────────────────────────────────────────────────────────

const COLLECT_CLASS_DATA = [
  {
    key: 'class1' as const,
    dot: 'bg-emerald-500',
    count: 28,
    images: [
      '/example/broccoli.webp',
      '/example/broccoli-2.webp',
      '/example/broccoli-2.webp',
      '/example/broccoli.webp',
    ],
  },
  {
    key: 'class2' as const,
    dot: 'bg-zinc-400',
    count: 24,
    images: [
      '/example/cauliflower.webp',
      '/example/cauliflower-2.webp',
      '/example/cauliflower-2.webp',
      '/example/cauliflower.webp',
    ],
  },
] as const;

function CollectVisual({ class1, class2 }: { class1: string; class2: string }) {
  const labels = { class1, class2 };
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="grid grid-cols-2 gap-2.5">
        {COLLECT_CLASS_DATA.map((cls) => {
          const label = labels[cls.key];
          return (
            <div key={cls.key} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`size-2 shrink-0 rounded-full ${cls.dot}`} />
                <span className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {cls.images.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                  >
                    <img
                      src={src}
                      alt={label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-right font-mono text-xs text-zinc-400">
                {cls.count} ảnh
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Train ───────────────────────────────────────────────────────────

const TRAIN_METRICS = [
  {
    label: 'Accuracy',
    value: '97.4%',
    color: 'text-emerald-600 dark:text-emerald-400',
    delay: '',
  },
  {
    label: 'Loss',
    value: '0.082',
    color: 'text-zinc-500 dark:text-zinc-400',
    delay: 'delay-75',
  },
  {
    label: 'Val Acc',
    value: '95.1%',
    color: 'text-sky-600 dark:text-sky-400',
    delay: 'delay-150',
  },
  {
    label: 'Val Loss',
    value: '0.124',
    color: 'text-zinc-500 dark:text-zinc-400',
    delay: 'delay-[225ms]',
  },
] as const;

function TrainVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Epochs</span>
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
              20 / 20
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full w-0 rounded-full bg-emerald-500 transition-all duration-[900ms] ease-out group-hover:w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {TRAIN_METRICS.map((m) => (
            <div
              key={m.label}
              className={`rounded-lg bg-zinc-50 p-2 opacity-40 transition-opacity duration-300 group-hover:opacity-100 dark:bg-zinc-800/60 ${m.delay}`}
            >
              <div className="text-xs text-zinc-400">{m.label}</div>
              <div className={`font-mono text-sm font-semibold ${m.color}`}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 opacity-0 transition-opacity duration-300 delay-300 group-hover:opacity-100">
          <div className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-zinc-400">Model saved</span>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Demo ────────────────────────────────────────────────────────────

const DEMO_RESULT_DATA = [
  {
    key: 'class1' as const,
    pct: 96,
    barClass: 'bg-emerald-500',
    barHover: 'group-hover:w-[96%]',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    delay: '',
  },
  {
    key: 'class2' as const,
    pct: 4,
    barClass: 'bg-zinc-400',
    barHover: 'group-hover:w-[4%]',
    textColor: 'text-zinc-500',
    delay: 'delay-75',
  },
] as const;

function DemoVisual({ class1, class2 }: { class1: string; class2: string }) {
  const labels = { class1, class2 };
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="relative overflow-hidden">
        <img
          src="/example/broccoli-plate.jpg"
          alt="Broccoli prediction demo"
          className="h-32 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <span className="rounded-md bg-black/40 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
            broccoli-plate.jpg
          </span>
        </div>
      </div>

      <div className="space-y-2.5 p-3">
        {DEMO_RESULT_DATA.map((r) => {
          const label = labels[r.key];
          return (
            <div key={r.key}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
                <span className={`font-mono text-xs font-medium ${r.textColor}`}>
                  {r.pct}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full w-0 rounded-full ${r.barClass} ${r.barHover} transition-all duration-700 ease-out ${r.delay}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step card wrapper ───────────────────────────────────────────────────────

function StepCard({
  children,
  connector,
  description,
  icon: Icon,
  step,
  title,
}: {
  children: React.ReactNode;
  connector: boolean;
  description: string;
  icon: React.ElementType;
  step: number;
  title: string;
}) {
  return (
    <div className="group flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="select-none text-5xl font-bold tracking-tight text-zinc-200 transition-colors duration-300 group-hover:text-zinc-300 dark:text-zinc-700 dark:group-hover:text-zinc-600">
          {String(step).padStart(2, '0')}
        </span>
        <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-white dark:group-hover:text-zinc-900">
          <Icon className="size-5" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>

      <div className="relative">
        <div className="transition-transform duration-300 group-hover:-translate-y-1">
          {children}
        </div>
        {connector && (
          <div className="absolute left-full top-1/2 hidden h-3 w-10 -translate-y-1/2 items-center sm:flex lg:w-12">
            <div className="relative h-px w-full bg-zinc-200 dark:bg-zinc-700">
              <div className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 shadow-[0_0_14px_rgba(56,189,248,0.45)] transition-all duration-700 ease-out group-hover:w-full dark:from-emerald-700 dark:via-sky-700 dark:to-amber-700" />
              <div className="absolute -left-0.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-zinc-300 transition-colors duration-300 group-hover:bg-emerald-400 dark:bg-zinc-600 dark:group-hover:bg-emerald-700" />
              <div className="absolute -right-0.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-zinc-300 transition-all duration-500 group-hover:scale-110 group-hover:bg-amber-400 dark:bg-zinc-600 dark:group-hover:bg-amber-700" />
            </div>
          </div>
        )}
      </div>

      <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const HomeHowItWorks: FunctionComponent = () => {
  const { t } = useAppProvider();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const class1 = t('home.howItWorks.sample.class1');
  const class2 = t('home.howItWorks.sample.class2');

  const sampleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/example/example-project.zip');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], 'example-project.zip', {
        type: 'application/zip',
      });
      return importProject(file);
    },
    onSuccess: async (projectId) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      startTransition(() => {
        void navigate({
          to: '/projects/$projectId/label',
          params: { projectId },
        });
      });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : t('home.howItWorks.sampleCtaError'),
      );
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
        <StepCard
          step={1}
          connector
          icon={IconDataLabel}
          title={t('project.nav.label')}
          description={t('home.howItWorks.label.description')}
        >
          <CollectVisual class1={class1} class2={class2} />
        </StepCard>

        <StepCard
          step={2}
          connector
          icon={IconDataTrain}
          title={t('project.nav.train')}
          description={t('home.howItWorks.train.description')}
        >
          <TrainVisual />
        </StepCard>

        <StepCard
          step={3}
          connector={false}
          icon={IconPlayerPlay}
          title={t('project.nav.play')}
          description={t('home.howItWorks.play.description')}
        >
          <DemoVisual class1={class1} class2={class2} />
        </StepCard>
      </div>

      <div className="mt-10 flex justify-center">
        <Button
          loading={sampleMutation.isPending}
          onClick={() => sampleMutation.mutate()}
          size="lg"
          radius="xl"
          variant="filled"
          color="dark"
          rightSection={<IconArrowRight className="size-4" />}
          className="min-w-56 shadow-[0_18px_40px_-20px_rgba(24,24,27,0.55)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {sampleMutation.isPending
            ? t('home.howItWorks.sampleCtaLoading')
            : t('home.howItWorks.sampleCta')}
        </Button>
      </div>
    </section>
  );
};

export default HomeHowItWorks;
