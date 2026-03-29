"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Activity, Cpu, Zap, TrendingUp } from "lucide-react"
import { TELEMETRY_HISTORY } from "@/lib/dashboard-store"
import { cn } from "@/lib/utils"

interface TelemetryTabProps {
  entropy: number
  lastAction: "PASS_GRANTED" | "BLOCK_TRIGGERED" | null
  gammaLimit: number
  interceptCount: number
}

function EntropyGauge({ value, limit }: { value: number; limit: number }) {
  const max = 3.0
  const pct = Math.min(value / max, 1)
  const angle = pct * 270 - 135
  const isHot = value > limit

  // SVG arc
  const r = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  const arcLength = (270 / 360) * circumference
  const filledLength = pct * arcLength

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-36 h-36">
        <svg width="140" height="140" viewBox="0 0 140 140">
          {/* Background arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
          />
          {/* Filled arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={isHot ? "#ff3131" : "#00ff41"}
            strokeWidth="8"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            transform={`rotate(135 ${cx} ${cy})`}
            style={{
              filter: isHot
                ? "drop-shadow(0 0 6px rgba(255,49,49,0.7))"
                : "drop-shadow(0 0 6px rgba(0,255,65,0.7))",
              transition: "all 0.5s ease",
            }}
          />
          {/* Needle indicator tick */}
          <line
            x1={cx}
            y1={cy - r + 12}
            x2={cx}
            y2={cy - r + 22}
            stroke={isHot ? "#ff3131" : "#00ff41"}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} ${cx} ${cy})`}
            style={{ transition: "all 0.5s ease" }}
          />
          {/* Center value */}
          <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle" fill={isHot ? "#ff3131" : "#00ff41"} fontSize="18" fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            {value.toFixed(2)}
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
            H(X)
          </text>
        </svg>
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-2 rounded-full pointer-events-none transition-all duration-500",
            isHot ? "shadow-[0_0_30px_rgba(255,49,49,0.2)]" : "shadow-[0_0_30px_rgba(0,255,65,0.12)]",
          )}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-mono text-[#6b7280] uppercase tracking-widest">Shannon Entropy</p>
        <p className={cn("text-xs font-mono font-bold mt-0.5", isHot ? "text-[#ff3131]" : "text-[#00ff41]")}>
          {isHot ? "ABOVE γ-LIMIT" : "WITHIN BOUNDS"}
        </p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d0d0d]/95 border border-white/10 rounded-lg px-3 py-2 backdrop-blur-xl text-xs font-mono">
        <p className="text-[#6b7280] mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.name === "entropy" ? "#00ff41" : p.name === "intercepts" ? "#ff3131" : "#00c4ff" }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function TelemetryTab({ entropy, lastAction, gammaLimit, interceptCount }: TelemetryTabProps) {
  const data = useMemo(() => TELEMETRY_HISTORY, [])

  const avgEntropy = useMemo(() => {
    const sum = data.reduce((acc, d) => acc + d.entropy, 0)
    return (sum / data.length).toFixed(2)
  }, [data])

  const totalIntercepts = data.reduce((acc, d) => acc + d.intercepts, 0) + interceptCount
  const totalTokens = data.reduce((acc, d) => acc + d.tokens, 0)

  const statCards = [
    {
      label: "Avg Entropy",
      value: avgEntropy,
      unit: "H(X)",
      icon: Activity,
      color: "#00ff41",
    },
    {
      label: "Total Intercepts",
      value: totalIntercepts,
      unit: "events",
      icon: Zap,
      color: "#ff3131",
    },
    {
      label: "Tokens Analyzed",
      value: (totalTokens / 1000).toFixed(1) + "k",
      unit: "tokens",
      icon: Cpu,
      color: "#00c4ff",
    },
    {
      label: "γ-Limit",
      value: gammaLimit.toFixed(1),
      unit: "threshold",
      icon: TrendingUp,
      color: "#fbbf24",
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-1">
        <Activity className="w-4 h-4 text-[#00ff41]" />
        <span className="text-sm font-mono text-[#00ff41] tracking-wider">TELEMETRY & ENTROPY MATRIX</span>
      </div>

      {/* Stat cards + gauge row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white/4 border border-white/8 rounded-2xl p-4 backdrop-blur-xl hover:border-white/14 hover:bg-white/6 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-[9px] font-mono text-[#4b5563] uppercase tracking-widest">{s.unit}</span>
            </div>
            <p className="text-xl font-mono font-bold" style={{ color: s.color, textShadow: `0 0 12px ${s.color}44` }}>
              {s.value}
            </p>
            <p className="text-[10px] text-[#6b7280] mt-1">{s.label}</p>
          </div>
        ))}
        {/* Entropy gauge card */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-4 backdrop-blur-xl flex items-center justify-center col-span-2 md:col-span-4 lg:col-span-1">
          <EntropyGauge value={entropy} limit={gammaLimit} />
        </div>
      </div>

      {/* Entropy over time */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono text-[#9ca3af] tracking-wider uppercase">Entropy Score — 24h Window</p>
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#4b5563]">
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#00ff41] inline-block" />H(X)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#ff3131]/60 inline-block border-dashed border-t border-[#ff3131]" />γ-limit</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="entropyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fill: "#374151", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: "#374151", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} domain={[0, 3.5]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={gammaLimit} stroke="#ff3131" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Area type="monotone" dataKey="entropy" stroke="#00ff41" strokeWidth={1.5} fill="url(#entropyGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Intercepts bar chart */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl">
        <p className="text-xs font-mono text-[#9ca3af] tracking-wider uppercase mb-4">Intercept Events — Hourly Distribution</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fill: "#374151", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: "#374151", fontSize: 9, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="intercepts" fill="#ff3131" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Formula section */}
      <div className="bg-white/4 border border-white/8 rounded-2xl p-5 backdrop-blur-xl">
        <p className="text-xs font-mono text-[#9ca3af] tracking-wider uppercase mb-4">Entropy Formulation</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[#4b5563] font-mono mb-2">Shannon Entropy (discrete)</p>
            <div className="bg-black/40 rounded-xl px-4 py-3 border border-white/6 font-mono text-sm text-[#00ff41]">
              H(X) = -Σ p(x) log₂ p(x)
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#4b5563] font-mono mb-2">Liability Intercept Condition</p>
            <div className="bg-black/40 rounded-xl px-4 py-3 border border-white/6 font-mono text-sm text-[#fbbf24]">
              H(X) {">"} γ → BLOCK_TRIGGERED
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#4b5563] font-mono mb-2">Token Savings Estimate</p>
            <div className="bg-black/40 rounded-xl px-4 py-3 border border-white/6 font-mono text-sm text-[#00c4ff]">
              ΔT = T_full - T_intercepted
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#4b5563] font-mono mb-2">Current Engine State</p>
            <div className={cn(
              "rounded-xl px-4 py-3 border font-mono text-sm",
              lastAction === "BLOCK_TRIGGERED"
                ? "bg-[#ff3131]/8 border-[#ff3131]/30 text-[#ff3131]"
                : "bg-[#00ff41]/8 border-[#00ff41]/20 text-[#00ff41]",
            )}>
              {lastAction ?? "STANDBY"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
