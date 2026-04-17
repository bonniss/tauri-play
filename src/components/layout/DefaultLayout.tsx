import { FunctionComponent, PropsWithChildren } from "react"
import AppHeader from "./AppHeader"

interface DefaultLayoutProps extends PropsWithChildren {}

const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <AppHeader />
      <main className="pt-[60px]">{children}</main>
    </div>
  )
}

export default DefaultLayout
