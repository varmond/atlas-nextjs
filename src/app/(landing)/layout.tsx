import { ReactNode } from "hono/jsx"
import { Navbar } from "../../components/navbar"

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default Layout
