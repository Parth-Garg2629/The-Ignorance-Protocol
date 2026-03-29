"use client"

import { useEffect, useState } from "react"
import { DollarSign, Zap, Leaf, BarChart2, TrendingDown } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { AuditEntry } from "@/lib/dashboard-store"
import { cn } from "@/lib/utils"

interface OpexTabProps {
  logs: AuditEntry[]
  interceptCount: number
}

function AnimatedCounter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start = 0
    const step = target / 60
    const interval = setInterval(() => {
      start += step
      if (start >= target) {
        setValue(target)
        clearInterval(interval)
      } else {
        setValue(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(interval)
  }, [target])

  return (
    <span className="count-up tabular-nums">
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  )
}

const PIE_COLORS = ["#00ff41", "#ff3131", "#00c4ff"]

export function OpexTab({ logs, interceptCount }: OpexTabProps) {
  const blockCount = logs.filter((l) => l.status === "BLOCK_TRIGGERED").length
  const passCount = logs.filter((l) => l.status === "PASS_GRANTED").length

  const BASE_TOKENS_SAVED = 42000
  const BASE_SAVED = 1204
  const BASE_INTERCEPTS = 14

  const tokensSaved = BASE_TOKENS_SAVED + interceptCount * 850
  const dollarSaved = BASE_SAVED + interceptCount * 24.08
  const totalIntercepts = BASE_INTERCEPTS + blockCount
  const co2Saved = (tokensSaved * 0.000003).toFixed(3)

  const pieData = [
    { name: "Pass Granted", value: passCount + 10 },
    { name: "Block Triggered", value: blockCount + 4 },
    { name: "Cached", value: Math.max(2, Math.floor(passCount * 0.3)) },
  ]

  const metricCards = [
    {
      label: "Compute Saved",
      value: <AnimatedCounter target={tokensSaved} />,
      unit: "tokens",
      icon: Zap,
      color: "#00ff41",
      sub: "+850 per intercept",
    },
    {
      label: "$ Saved",
      value: <AnimatedCounter target={Math.floor(dollarSaved)} prefix="$" />,
      unit: "USD",
      icon: DollarSign,
      color: "#fbbf24",
      sub: "~$24.08/intercept",
    },
    {
      label: "Enterprise Intercepts",
      value: <AnimatedCounter target={totalIntercepts} />,
      unit: "blocks",
      icon: BarChart2,
      color: "#ff3131",
      sub: "liability events",
    },
    {
      label: "CO₂ Saved",
      value: <span className="tabular-nums">{co2Saved}</span>,
      unit: "kg CO₂e",
      icon: Leaf,
      color: "#34d399",
      sub: "Green AI impact",
    },
  ]

  const savingsBreakdown = [
    { label: "Token Reduction", pct: 68, color: "#00ff41" },
    { label: "Latency Avoided", pct: 22, color: "#00c4ff" },
    { label: "Infra Cost", pct: 10, color: "#fbbf24" },
  ]

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-1">
        <TrendingDown className="w-4 h-4 text-[#00ff41]" />
        <span className="text-sm font-mono text-[#00ff41] tracking-wider">OPEX & GREEN AI IMPACT</span>
      </div>

      {/* Main metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metricCards.map((m) => (
          <div
            key={m.label}
            className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl hover:border-white/14 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <m.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" style={{ color: m.color }} />
              <span
                className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border"
                style={{ color: m.color, borderColor: `${m.color}30`, background: `${m.color}10` }}
              >
                {m.unit}
              </span>
            </div>
            <p
              className="text-2xl font-mono font-bold leading-none"
              style={{ color: m.color, textShadow: `0 0 20px ${m.color}44` }}
            >
              {m.value}
            </p>
            <p className="text-xs text-[#6b7280] mt-1.5">{m.label}</p>
            <p className="text-[10px] text-[#374151] mt-0.5 font-mono">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-4">Request Outcome Distribution</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  strokeWidth={0}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px", fontFamily: "JetBrains Mono" }}
                  itemStyle={{ color: "#c0c0c0" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-xs">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[#9ca3af] font-mono">{d.name}</span>
                  <span className="font-mono font-bold ml-auto" style={{ color: PIE_COLORS[i] }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings breakdown */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl">
          <p className="text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-4">Cost Savings Breakdown</p>
          <div className="flex flex-col gap-3">
            {savingsBreakdown.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#6b7280]">{s.label}</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${s.pct}%`,
                      background: s.color,
                      boxShadow: `0 0 8px ${s.color}60`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* ROI box */}
          <div className="mt-5 bg-[#00ff41]/6 border border-[#00ff41]/15 rounded-xl p-3">
            <p className="text-[10px] font-mono text-[#4b5563] uppercase tracking-widest mb-1">Projected Annual ROI</p>
            <p className="text-xl font-mono font-bold text-[#00ff41] glow-text-green">
              $<AnimatedCounter target={Math.floor(dollarSaved * 52)} />
            </p>
            <p className="text-[10px] text-[#6b7280] font-mono mt-0.5">Based on current intercept rate</p>
          </div>
        </div>
      </div>

      {/* Green AI banner */}
      <div className="bg-gradient-to-r from-[#00ff41]/6 to-transparent border border-[#00ff41]/15 rounded-2xl p-5 flex items-center gap-5 backdrop-blur-xl">
        <div className="w-10 h-10 rounded-xl bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-[#00ff41]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#c0c0c0]">Carbon Footprint Reduction</p>
          <p className="text-xs text-[#6b7280] mt-0.5">
            By intercepting high-entropy prompts early, The Ignorance Protocol has prevented{" "}
            <span className="text-[#34d399] font-mono font-bold">{co2Saved} kg CO₂e</span> of compute emissions
            this session. Every blocked hallucination is a greener future.
          </p>
        </div>
        <div className={cn("ml-auto flex-shrink-0 text-right")}>
          <p className="text-2xl font-mono font-bold text-[#34d399]">{co2Saved}</p>
          <p className="text-[10px] text-[#4b5563] font-mono">kg CO₂e saved</p>
        </div>
      </div>
    </div>
  )
}
