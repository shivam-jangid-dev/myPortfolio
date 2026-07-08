import { CustomCursor } from '@/components/CustomCursor'
import { SmoothScroll } from '@/components/SmoothScroll'
import { ThemeProvider } from '@/context/ThemeProvider'
import { MainLayout } from '@/layouts/MainLayout'
import { Home } from '@/pages/Home'
import { ProjectDetails } from '@/pages/ProjectDetails'
import { ResumeAnalyserPage } from '@/pages/ResumeAnalyserPage'
import { RepoExplainerPage } from '@/pages/RepoExplainerPage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <BrowserRouter>
          <a
            href="#main"
            className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground focus:translate-y-0 focus:outline-none"
          >
            Skip to content
          </a>
          <CustomCursor />
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="projects/:projectId" element={<ProjectDetails />} />
              <Route path="tools/resume-analyser" element={<ResumeAnalyserPage />} />
              <Route path="tools/repo-explainer" element={<RepoExplainerPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SmoothScroll>
    </ThemeProvider>
  )
}

