import { CalendarDays } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const timeRanges = [
  { value: "7d", label: "Last 7 days", description: "January 20 - 27, 2024" },
  { value: "30d", label: "Last 30 days", description: "December 28, 2023 - January 27, 2024" },
  { value: "3m", label: "Last 3 months", description: "October 27, 2023 - January 27, 2024" },
]

export function TimeRangeSelector({ value = "7d", onValueChange, className = "" }) {
  const selectedRange = timeRanges.find(range => range.value === value)
  
  // Calculate actual date ranges
  const getDateRange = (rangeValue) => {
    const now = new Date()
    const start = new Date()
    
    switch (rangeValue) {
      case "7d":
        start.setDate(now.getDate() - 7)
        break
      case "30d":
        start.setDate(now.getDate() - 30)
        break
      case "3m":
        start.setMonth(now.getMonth() - 3)
        break
      default:
        start.setDate(now.getDate() - 7)
    }
    
    return {
      start: start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      end: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }

  const currentRange = getDateRange(value)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent align="end">
          {timeRanges.map((range) => {
            const dateRange = getDateRange(range.value)
            return (
              <SelectItem key={range.value} value={range.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{range.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {dateRange.start} - {dateRange.end}
                  </span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
