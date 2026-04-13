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
    bg: "",
    iconBg: "",
    text: "text-white",
    subtext: "text-white/80",
    trendText: "text-white/80",
    inlineBg: "#00bcb6",
    inlineIconBg: "#2e9c8f",
  },
  teal: {
    bg: "bg-white",
    iconBg: "bg-[#f0fdfc]",
    text: "text-[#0f172a]",
    subtext: "text-[#64748b]",
    trendText: "text-[#00a89e]",
    iconColor: "text-[#00bcb6]",
    border: "border border-[#e2e8f0]",
  },
  amber: {
    bg: "bg-white",
    iconBg: "bg-[#f0fdfc]",
    text: "text-[#0f172a]",
    subtext: "text-[#64748b]",
    trendText: "text-[#00a89e]",
    iconColor: "text-[#00bcb6]",
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

  const inlineBg = (colors as { inlineBg?: string }).inlineBg
  const inlineIconBg = (colors as { inlineIconBg?: string }).inlineIconBg

  return (
    <div
      className={cn(
        "rounded-xl p-5 shadow-sm",
        colors.bg,
        (colors as { border?: string }).border
      )}
      style={inlineBg ? { backgroundColor: inlineBg } : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "p-2.5 rounded-lg",
            colors.iconBg
          )}
          style={inlineIconBg ? { backgroundColor: inlineIconBg } : undefined}
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
