import { FunctionComponent, PropsWithChildren } from "react"
import AppHeader from "./AppHeader"

interface DefaultLayoutProps extends PropsWithChildren {}

const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => {
  return (
    <div className="container space-y-4">
      <AppHeader />
      <main>{children}</main>
    </div>
  )
}

export default DefaultLayout
