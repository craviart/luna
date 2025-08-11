import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import { Loader2, BarChart3, Activity, Zap, Globe } from 'lucide-react'

import { ThemeProvider } from './components/theme-provider'
import { ThemeToggle } from './components/theme-toggle'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SidebarProvider, SidebarTrigger, SidebarInset } from './components/ui/sidebar'
import { AppSidebar } from './components/AppSidebar'
import AuthForm from './components/AuthForm'
import Dashboard from './pages/Dashboard'
import URLsPage from './pages/URLsPage'
import URLDetail from './pages/URLDetail'
import QuickTesting from './pages/QuickTesting'
import QuickTestResult from './pages/QuickTestResult'
import Snapshots from './pages/Snapshots'

// Luna taglines for the dashboard
const lunaTaglines = [
  "Luna purrs with insights.",
  "Luna uncovers hidden paths.",
  "Luna brightens your data.",
  "Luna leaps to conclusions.",
  "Luna watches every trend.",
  "Luna sniffs out anomalies.",
  "Luna prowls through patterns.",
  "Luna guides your journey.",
  "Luna sharpens your focus.",
  "Luna reveals the unseen.",
  "Luna whispers secrets softly.",
  "Luna prowls the data jungle.",
  "Luna's eyes see everything.",
  "Luna navigates the night.",
  "Luna finds clarity in chaos.",
  "Luna's touch is magical.",
  "Luna's gaze pierces the veil.",
  "Luna dances with numbers.",
  "Luna's grace is unmatched.",
  "Luna illuminates the shadows.",
  "Luna explores every corner.",
  "Luna's curiosity never fades.",
  "Luna hunts for insights.",
  "Luna pounces on opportunities.",
  "Luna's intuition is unmatched.",
  "Luna dreams of possibilities.",
  "Luna's wisdom lights the way.",
  "Luna captures the moment.",
  "Luna's elegance is timeless.",
  "Luna reflects deeper truths.",
  "Luna's steps are calculated.",
  "Luna masters the art of analysis.",
  "Luna sees beyond the surface.",
  "Luna transforms data into stories.",
  "Luna's presence calms the chaos.",
  "Luna finds order in randomness.",
  "Luna connects the dots seamlessly.",
  "Luna's insight is razor-sharp.",
  "Luna weaves through complexity.",
  "Luna discovers the extraordinary.",
  "Luna's precision is unmatched.",
  "Luna creates harmony from discord.",
  "Luna's vision spans horizons.",
  "Luna adapts to every challenge.",
  "Luna thrives in uncertainty.",
  "Luna's logic cuts through noise.",
  "Luna builds bridges from data.",
  "Luna's patience reveals truth.",
  "Luna transforms confusion into clarity.",
  "Luna's energy is contagious.",
  "Luna inspires deeper thinking.",
  "Luna's approach is methodical.",
  "Luna celebrates small victories.",
  "Luna's persistence pays off.",
  "Luna finds beauty in patterns.",
  "Luna's curiosity drives discovery.",
  "Luna's focus is laser-sharp.",
  "Luna anticipates the unexpected.",
  "Luna's wisdom transcends time.",
  "Luna creates order from chaos.",
  "Luna's insights spark innovation.",
  "Luna navigates complex terrains.",
  "Luna's intuition guides decisions.",
  "Luna transforms complexity into simplicity.",
  "Luna's perspective shifts paradigms.",
  "Luna discovers hidden connections.",
  "Luna's analysis reveals opportunities.",
  "Luna's observations are profound.",
  "Luna catalyzes meaningful change.",
  "Luna's understanding runs deep.",
  "Luna's approach is always fresh.",
  "Luna illuminates dark corners.",
  "Luna's methods are time-tested.",
  "Luna adapts with graceful ease.",
  "Luna's insights bridge gaps.",
  "Luna creates clarity from confusion.",
  "Luna's vision sees possibilities.",
  "Luna's logic unravels mysteries.",
  "Luna's patience builds understanding.",
  "Luna transforms data into wisdom.",
  "Luna's energy ignites progress.",
  "Luna's precision crafts excellence.",
  "Luna discovers patterns in chaos.",
  "Luna's intuition reads between lines.",
  "Luna's focus achieves breakthroughs.",
  "Luna's wisdom guides the way.",
  "Luna's insights illuminate paths.",
  "Luna's analysis opens new doors.",
  "Luna's understanding connects worlds.",
  "Luna's observations shape futures.",
  "Luna's approach transcends limits.",
  "Luna's perspective reveals truth.",
  "Luna's methods create magic.",
  "Luna's journey continues onward.",
  "Luna's legacy lives in insights.",
  "Luna's wisdom echoes through time.",
  "Luna's spirit drives discovery.",
  "Luna's essence captures wonder.",
  "Luna's power transforms everything.",
  "Luna's paws are your path.",
  "Luna's light is your guide."
]

// Get page information based on current route
const getPageInfo = (pathname) => {
  switch (pathname) {
    case '/':
      return {
        title: lunaTaglines[Math.floor(Math.random() * lunaTaglines.length)],
        icon: BarChart3,
        isDashboard: true
      }
    case '/urls':
      return {
        title: 'Monitored Pages',
        icon: Activity,
        isDashboard: false
      }
    case '/quick-testing':
      return {
        title: 'Quick Testing',
        icon: Zap,
        isDashboard: false
      }
    case '/snapshots':
      return {
        title: 'Visual Snapshots',
        icon: Activity,
        isDashboard: false
      }

    default:
      if (pathname.startsWith('/urls/') && pathname.endsWith('/results')) {
        return {
          title: 'URL Results',
          icon: BarChart3,
          isDashboard: false
        }
      }
      if (pathname.startsWith('/quick-testing/') && pathname.endsWith('/results')) {
        return {
          title: 'Test Results',
          icon: Zap,
          isDashboard: false
        }
      }
      return {
        title: 'Luna Analytics',
        icon: Globe,
        isDashboard: false
      }
  }
}

function AuthenticatedApp() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const pageInfo = getPageInfo(location.pathname)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">{pageInfo.title}</h1>
          </div>
          <div className="ml-auto pr-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/urls" element={<URLsPage />} />
            <Route path="/urls/:id/results" element={<URLDetail />} />
            <Route path="/quick-testing" element={<QuickTesting />} />
            <Route path="/quick-testing/:id/results" element={<QuickTestResult />} />
            <Route path="/snapshots" element={<Snapshots />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function App() {
  return (
          <ThemeProvider defaultTheme="system" storageKey="luna-ui-theme">
      <AuthProvider>
        <Router>
          <AuthenticatedApp />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: '',
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
