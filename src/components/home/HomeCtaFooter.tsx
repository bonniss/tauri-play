import { Button } from "@mantine/core"
import { IconArrowRight } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { FunctionComponent } from "react"
import { useAppProvider } from "../layout/AppProvider"
import MarkdownViewer from "../shared/MarkdownViewer"
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
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-6 text-center md:px-10 text-white/90">
          <div className="space-y-1">
            <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto max-w-xl text-base leading-7">
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
          <Logo animated className="size-32" />
          <MarkdownViewer className="prose-sm prose-invert prose-a:text-white/70 prose-a:no-underline hover:prose-a:text-white hover:prose-a:underline prose-p:text-white/50 prose-p:m-0">
            {t("home.cta.author")}
          </MarkdownViewer>
        </div>
      </div>
    </section>
  )
}

export default HomeCtaFooter
