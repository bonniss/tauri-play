import React from "react"
import ReactDOM from "react-dom/client"
import { AppProvider } from "./components/layout/AppProvider"
import { AppRouter } from "./router"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </React.StrictMode>,
)
