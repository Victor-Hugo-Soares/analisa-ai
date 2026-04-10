import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: "navy" | "teal" | "amber" | "red"
  trend?: {
    value: string
    positive: boolean
  }
}

const colorMap = {
  navy: {
    bg: "bg-[#1a2744]",
    iconBg: "bg-[#243459]",
    text: "text-white",
    subtext: "text-blue-200",
    trendText: "text-blue-200",
  },
  teal: {
    bg: "bg-white",
    iconBg: "bg-[#f0fdfa]",
    text: "text-[#0f172a]",
    subtext: "text-[#64748b]",
    trendText: "text-[#0f766e]",
    iconColor: "text-[#0f766e]",
    border: "border border-[#e2e8f0]",
  },
  amber: {
    bg: "bg-white",
    iconBg: "bg-amber-50",
    text: "text-[#0f172a]",
    subtext: "text-[#64748b]",
    trendText: "text-amber-600",
    iconColor: "text-amber-600",
    border: "border border-[#e2e8f0]",
  },
  red: {
    bg: "bg-white",
    iconBg: "bg-red-50",
    text: "text-[#0f172a]",
    subtext: "text-[#64748b]",
    trendText: "text-red-600",
    iconColor: "text-red-600",
    border: "border border-[#e2e8f0]",
  },
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        "rounded-xl p-5 shadow-sm",
        colors.bg,
        (colors as { border?: string }).border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-2.5 rounded-lg",
            colors.iconBg
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              color === "navy"
                ? "text-white"
                : (colors as { iconColor?: string }).iconColor
            )}
          />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              trend.positive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {trend.positive ? "+" : ""}{trend.value}
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-3xl font-bold mb-1", colors.text)}>{value}</p>
        <p className={cn("text-sm font-medium", colors.text)}>{title}</p>
        {subtitle && (
          <p className={cn("text-xs mt-1", colors.subtext)}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
