import { Footer } from '@/layouts/Footer'
import { Navbar } from '@/layouts/Navbar'
import { AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

export function MainLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="pt-[4.25rem]">
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
