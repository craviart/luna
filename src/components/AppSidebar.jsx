import { 
  BarChart3, 
  Activity, 
  Camera, 
  Shield,
  LogOut,
  Zap,
  Target,
  Monitor,
  FileSearch,
  Github
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "./ui/sidebar"
import { Button } from "./ui/button"
import { ThemeToggle } from "./theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

// Cute cat behaviors for Luna logo hover
const catBehaviors = [
  "purrs softly",
  "meows happily", 
  "nuzzles you",
  "wags tail",
  "blinks slowly",
  "paws gently",
  "stretches cutely",
  "plays with yarn",
  "chases tail",
  "snoozes peacefully",
  "curious look",
  "licks paw",
  "flicks whiskers",
  "curls up",
  "pounces playfully",
  "rolls over",
  "peeks curiously",
  "bats at string",
  "whiskers twitch",
  "softly meows",
  "cuddles close",
  "tail flicks",
  "kneads softly",
  "ears perk up",
  "snuggles warmly",
  "gazes lovingly",
  "sits regally",
  "bounces lightly",
  "paws at screen",
  "yawns cutely",
  "purrs loudly",
  "hides playfully",
  "tail sways",
  "sneaks around",
  "tiptoes quietly",
  "head tilts",
  "grooming session",
  "nap time",
  "whiskers wiggle",
  "sneezes softly",
  "curious glance",
  "flops over",
  "wiggles ears",
  "gently purrs",
  "tail curls",
  "batting eyes",
  "dreams sweetly",
  "mischievous grin",
  "fluffy pounce",
  "gentle nudge"
]

// Menu items for the Luna Analytics dashboard - Monitoring section
const monitoringItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Monitored Pages",
    url: "/urls", 
    icon: Activity,
  },
  {
    title: "Code Coverage",
    url: "/code-coverage",
    icon: FileSearch,
    disabled: true,
    tooltip: "Coming soon",
  },
  {
    title: "Snapshots",
    url: "/snapshots",
    icon: Camera,
    disabled: true,
    tooltip: "Coming soon",
  },
]

// Admin section items
const adminItems = [
  {
    title: "API Monitoring",
    url: "/api-monitoring",
    icon: Monitor,
  },
  {
    title: "GitHub Repo",
    url: "https://github.com/craviart/luna",
    icon: Github,
    external: true,
  },
]

// Tools section items
const toolsItems = [
  {
    title: "Quick Testing",
    url: "/quick-testing",
    icon: Zap,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { signOut, hasPermission, user } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const [subtitleText, setSubtitleText] = useState("Performance monitoring")
  const [isHovering, setIsHovering] = useState(false)

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleLogoHover = () => {
    if (!isHovering) {
      setIsHovering(true)
      const randomBehavior = catBehaviors[Math.floor(Math.random() * catBehaviors.length)]
      setSubtitleText(randomBehavior)
    }
  }

  const handleLogoLeave = () => {
    setIsHovering(false)
    setSubtitleText("Performance monitoring")
  }

  const handleNavigationClick = () => {
    // Close sidebar on mobile when navigation link is clicked
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div 
            className="flex h-8 w-8 items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110"
            onMouseEnter={handleLogoHover}
            onMouseLeave={handleLogoLeave}
          >
            <img src="/luna.svg" alt="Luna" className="h-8 w-8" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Luna Analytics</span>
            <span className="truncate text-xs text-muted-foreground transition-all duration-300 ease-in-out">
              {subtitleText}
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider>
                {monitoringItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="opacity-50 cursor-not-allowed">
                            <SidebarMenuButton 
                              disabled
                              className="pointer-events-none"
                            >
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url} onClick={handleNavigationClick}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider>
                {toolsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="opacity-50 cursor-not-allowed">
                            <SidebarMenuButton 
                              disabled
                              className="pointer-events-none"
                            >
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link to={item.url} onClick={handleNavigationClick}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider>
                {adminItems.filter(item => {
                  // Show API Monitoring only if user has permission
                  if (item.title === "API Monitoring") {
                    return hasPermission('viewApiMonitoring')
                  }
                  return true
                }).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div className="opacity-50 cursor-not-allowed">
                            <SidebarMenuButton 
                              disabled
                              className="pointer-events-none"
                            >
                              <item.icon />
                              <span>{item.title}</span>
                            </SidebarMenuButton>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton asChild isActive={!item.external && isActive(item.url)}>
                        {item.external ? (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={handleNavigationClick}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        ) : (
                          <Link to={item.url} onClick={handleNavigationClick}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
            
            {/* Version Info */}
            <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50 mt-2">
              <div className="mb-1">
                <span>Version v0.5.0-beta</span>
              </div>
              <div className="text-[10px] text-muted-foreground/70 mb-2">
                AI-powered performance insights
              </div>
              <Link 
                to="/changelog" 
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors duration-200 underline underline-offset-2"
                onClick={handleNavigationClick}
              >
                View changelog
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-2 py-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                  <Shield className="h-3 w-3" />
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium">{user?.role || 'User'}</span>
                  <span className="truncate text-[10px] text-muted-foreground">Authenticated</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="h-8 w-8 p-0"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}