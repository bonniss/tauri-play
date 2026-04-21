import { createFileRoute } from "@tanstack/react-router"
import HomeCtaFooter from "~/components/home/HomeCtaFooter"
import HomeFeatures from "~/components/home/HomeFeatures"
import HomeHero from "~/components/home/HomeHero"
import HomeHowItWorks from "~/components/home/HomeHowItWorks"
import HomeIntro from "~/components/home/HomeIntro"
import HomePlatform from "~/components/home/HomePlatform"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-16 pb-24">
      <HomeHero />
      <HomeHowItWorks />
      <HomeIntro />
      <HomePlatform />
      <HomeFeatures />
      <HomeCtaFooter />
    </div>
  )
}

export default HomePage
