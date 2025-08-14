import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

const ChangelogEntry = ({ version, date, title, description, children }) => {

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          {date}
        </div>
        {version && (
          <Badge variant="outline" className="font-mono">
            {version}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl mb-2">{title}</CardTitle>
          {description && (
            <CardDescription className="text-base leading-relaxed">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {children && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

const ChangeSection = ({ title, items }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <h4 className="font-semibold text-foreground">{title}</h4>
      <Badge variant="secondary">
        {items.length}
      </Badge>
    </div>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Changelog</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Stay up to date with new features, improvements, and bug fixes in Luna Analytics.
          </p>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-8">
          <ChangelogEntry
            version="v0.4.0-beta"
            date="August 14, 2025"
            title="Changelog Page & Admin Sidebar Updates"
            description="Professional changelog documentation and improved admin navigation with GitHub repository access."
          >
            <ChangeSection
              title="New Features"
              items={[
                "Comprehensive changelog page inspired by Linear's design",
                "GitHub repository link in Admin sidebar (opens in new tab)",
                "Professional release documentation with categorized sections",
                "Clean, icon-free changelog layout for better content focus",
                "Real commit dates from git history for authentic timeline"
              ]}
            />

            <ChangeSection
              title="Admin Section Improvements"
              items={[
                "Renamed 'Performance' section to 'Admin' for better clarity",
                "Added GitHub Repo link with external link handling",
                "Secure external link implementation (target='_blank' with rel='noopener')",
                "Smart link rendering: external links use <a> tag, internal use <Link>",
                "Maintained permission system for API Monitoring access"
              ]}
            />

            <ChangeSection
              title="Documentation Enhancements"
              items={[
                "Detailed release history from v0.1.0-beta to current version",
                "Categorized changelog sections (Features, Improvements, Fixes, Security)",
                "Professional footer and clean navigation integration",
                "Accessible via 'View changelog' link below version number",
                "Consistent with Luna Analytics design system and branding"
              ]}
            />
          </ChangelogEntry>

          <ChangelogEntry
            version="v0.3.0-beta"
            date="August 14, 2025"
            title="Role-based Access Control & Critical Bug Fixes"
            description="Major security enhancement with comprehensive user role management system, plus critical stability improvements for monitored page data loading."
          >
            <ChangeSection
              title="New Features"
              items={[
                "Role-based Access Control (RBAC) system with Admin and Viewer profiles",
                "Admin profile with full management capabilities",
                "Viewer profile with read-only access and restricted actions",
                "Dynamic role display in sidebar footer showing current user role",
                "ProtectedRoute component for route-level access control",
                "Permission-based UI rendering with hasPermission() utility",
                "Role-specific welcome messages on authentication"
              ]}
            />

            <ChangeSection
              title="Security Enhancements"
              items={[
                "API Monitoring page hidden from Viewer role (sidebar + route protection)",
                "Add URL and Analyse All buttons hidden for Viewer users",
                "Run New Analysis functionality restricted to Admin role",
                "Professional access denied messages for unauthorized access attempts",
                "Persistent role storage with secure localStorage management"
              ]}
            />

            <ChangeSection
              title="Critical Bug Fixes"
              items={[
                "Fixed blank monitored pages results with smart fallback query system",
                "Resolved ReferenceError: Zap is not defined in URLDetail component",
                "Enhanced error handling with user-friendly toast notifications",
                "Added debugging console logs for data loading troubleshooting",
                "Improved time range filtering with automatic fallback to all data"
              ]}
            />

            <ChangeSection
              title="User Experience Improvements"
              items={[
                "Seamless role-based navigation with hidden restricted features",
                "Clear feedback system showing user role throughout the interface",
                "No broken links or confused navigation for unauthorized features",
                "Enhanced authentication flow with role confirmation",
                "Professional enterprise-grade access control experience"
              ]}
            />
          </ChangelogEntry>

          <ChangelogEntry
            version="v0.2.0-beta"
            date="August 14, 2025"
            title="Clean UI & Improved Experience"
            description="Comprehensive user interface improvements with enhanced charts, tooltips, and sidebar reorganization for better user experience."
          >
            <ChangeSection
              title="UI Enhancements"
              items={[
                "Converted area charts to line charts for cleaner data visualization",
                "Added visible dots and labels to all performance charts",
                "Implemented performance threshold indicators with dotted reference lines",
                "Updated color scheme to use consistent blue tones (blue-200, blue-400, blue-600)",
                "Reorganized sidebar with new Tools section for Quick Testing",
                "Moved API Monitoring to dedicated Performance section"
              ]}
            />

            <ChangeSection
              title="Interactive Features"
              items={[
                "Added hover tooltips for FCP and LCP metrics with detailed explanations",
                "Implemented HoverCard component for educational metric information",
                "Color-coded performance thresholds based on Google PageSpeed Insights",
                "Enhanced dashboard cards with analysis date/time display",
                "Improved table styling with borderless badges and increased font sizes"
              ]}
            />

            <ChangeSection
              title="Performance & Charts"
              items={[
                "Performance Score thresholds: Good (90+), Needs Improvement (50-90), Poor (<50)",
                "LCP thresholds: Good (<2.5s), Needs Improvement (2.5-4s), Poor (>4s)",
                "FCP thresholds: Good (<1.8s), Needs Improvement (1.8-3s), Poor (>3s)",
                "Consistent chart styling across Dashboard and URLDetail pages",
                "Removed gradient fills to prevent visual overlap and confusion"
              ]}
            />
          </ChangelogEntry>

          <ChangelogEntry
            version="v0.1.0-beta"
            date="August 6, 2025"
            title="Initial Beta Release"
            description="First public beta release of Luna Analytics with core performance monitoring capabilities and automated analysis features."
          >
            <ChangeSection
              title="Core Features"
              items={[
                "PageSpeed Insights API integration for performance analysis",
                "Automated analysis scheduling (3x daily at 6am, 2pm, 10pm UTC)",
                "PIN-code authentication system for secure access",
                "Responsive dashboard with performance metric cards",
                "URL monitoring with evolution charts and history tracking"
              ]}
            />

            <ChangeSection
              title="Analysis Capabilities"
              items={[
                "Core Web Vitals monitoring (LCP, FCP, Performance Score)",
                "Speed Index, Total Blocking Time, and Cumulative Layout Shift tracking",
                "Quick testing functionality for one-time URL analysis",
                "Historical data visualization with time range filtering",
                "Analysis result tables with comprehensive performance data"
              ]}
            />

            <ChangeSection
              title="Technical Foundation"
              items={[
                "React frontend with Vite build system",
                "Supabase backend for data storage and management",
                "Vercel deployment with GitHub Actions automation",
                "Tailwind CSS for responsive design",
                "shadcn/ui component library for consistent UI"
              ]}
            />
          </ChangelogEntry>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              End of changelog
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
