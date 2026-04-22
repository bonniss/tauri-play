import { Button } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"
import Logo from "../shared/logo/Logo"

const HomeCtaFooter: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="relative left-1/2 w-[calc(100vw-4px)]  -translate-x-1/2 overflow-hidden text-slate-800 -mt-20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        aria-hidden="true"
        className="relative z-10 block w-full"
        fill="none"
      >
        <path
          fill="currentColor"
          fillOpacity="1"
          d="M0,192L48,208C96,224,192,256,288,250.7C384,245,480,203,576,181.3C672,160,768,160,864,133.3C960,107,1056,53,1152,80C1248,107,1344,213,1392,266.7L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      <div className="relative -mt-px bg-current pb-20">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-6 text-center md:px-10 md:pt-8 text-white">
          <Logo
            animated
            className="size-28"
          />

          <div className="space-y-2">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto max-w-xl text-base leading-7 text-white/82 md:text-lg">
              {t("home.cta.description")}
            </p>
          </div>

          <Button
            size="xl"
            color="green.9"
            component={Link}
            rightSection={<IconArrowRight className="size-4" />}
            search={{ create: true } as never}
            to="/projects"
          >
            {t("home.hero.cta")}
          </Button>
        </div>
      </div>
    </section>
  )
}

export default HomeCtaFooter
