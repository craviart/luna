import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const timeRanges = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
]

export function TimeRangeSelector({ value = "7d", onValueChange, className = "" }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent align="end">
        {timeRanges.map((range) => (
          <SelectItem key={range.value} value={range.value}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
