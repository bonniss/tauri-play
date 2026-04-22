import { createFileRoute } from "@tanstack/react-router"
import HomeCtaFooter from "~/components/home/HomeCtaFooter"
import HomeFeatures from "~/components/home/HomeFeatures"
import HomeFaq from "~/components/home/HomeFaq"
import HomeHero from "~/components/home/HomeHero"
import HomeLiveDemo from "~/components/home/HomeLiveDemo"
import HomeUsage from "~/components/home/HomeUsage"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <HomeHero />
      <HomeLiveDemo />
      <HomeUsage />
      <HomeFeatures />
      <HomeFaq />
      <HomeCtaFooter />
    </div>
  )
}

export default HomePage
