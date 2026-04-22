import { Button } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"
import Logo from "../shared/logo/Logo"

const HomeCtaFooter: FunctionComponent = () => {
  const { t } = useAppProvider()

  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 overflow-x-hidden bg-zinc-800 py-16">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 z-[-1]"
        fill="none"
      >
        <path
          fill="#000b76"
          fill-opacity="1"
          d="M0,192L48,208C96,224,192,256,288,250.7C384,245,480,203,576,181.3C672,160,768,160,864,133.3C960,107,1056,53,1152,80C1248,107,1344,213,1392,266.7L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
      <div className="px-6 pb-20 pt-6 text-white md:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Logo
              animated
              className="size-48 drop-shadow-[0_20px_32px_rgba(0,0,0,0.18)]"
            />
          </div>

          <div className="space-y-3">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-white/88 md:text-lg">
              {t("home.cta.description")}
            </p>
          </div>

          <Button
            color="dark"
            component={Link}
            rightSection={<IconArrowRight className="size-4" />}
            search={{ create: true } as never}
            size="lg"
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
