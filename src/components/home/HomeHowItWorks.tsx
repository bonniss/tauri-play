import { IconCamera, IconPlayerPlay, IconTag } from "@tabler/icons-react"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"

type HowItWorksStep = {
  descriptionKey: string
  icon: React.ElementType
  step: number
  titleKey: string
}

const STEPS: HowItWorksStep[] = [
  {
    step: 1,
    icon: IconTag,
    titleKey: "project.nav.label",
    descriptionKey: "home.howItWorks.label.description",
  },
  {
    step: 2,
    icon: IconCamera,
    titleKey: "project.nav.train",
    descriptionKey: "home.howItWorks.train.description",
  },
  {
    step: 3,
    icon: IconPlayerPlay,
    titleKey: "project.nav.play",
    descriptionKey: "home.howItWorks.play.description",
  },
]

const HomeHowItWorks: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="mx-auto w-full max-w-6xl px-6 md:px-10">
      {/* <h3 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {t("home.howItWorks.title")}
      </h3> */}
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.titleKey} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="select-none text-5xl font-bold tracking-tight text-zinc-200 dark:text-zinc-700">
                  {String(step.step).padStart(2, "0")}
                </span>
                {index < STEPS.length - 1 && (
                  <div className="hidden h-px flex-1 bg-zinc-200 dark:bg-zinc-700 sm:block" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Icon className="size-5 text-zinc-400 dark:text-zinc-500" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(step.titleKey)}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t(step.descriptionKey)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default HomeHowItWorks
