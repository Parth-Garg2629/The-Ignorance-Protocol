"use client"

import { useState } from "react"
import { Settings, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsTabProps {
  gammaLimit: number
  onGammaChange: (v: number) => void
  onToast: (msg: string, type?: "success" | "warning") => void
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  color = "green",
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  color?: "green" | "red" | "blue"
}) {
  const colors = {
    green: { on: "bg-[#00ff41]", glow: "shadow-[0_0_12px_rgba(0,255,65,0.5)]", text: "text-[#00ff41]" },
    red: { on: "bg-[#ff3131]", glow: "shadow-[0_0_12px_rgba(255,49,49,0.5)]", text: "text-[#ff3131]" },
    blue: { on: "bg-[#00c4ff]", glow: "shadow-[0_0_12px_rgba(0,196,255,0.5)]", text: "text-[#00c4ff]" },
  }
  const c = colors[color]

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm text-[#c0c0c0]">{label}</p>
        <p className="text-xs text-[#4b5563] mt-0.5 font-mono">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 active:scale-95",
          checked ? `${c.on} border-transparent ${c.glow}` : "bg-white/6 border-white/10",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  )
}

function GammaSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const min = 0.5
  const max = 3.0
  const pct = ((value - min) / (max - min)) * 100

  const getColor = () => {
    if (value < 1.2) return "#00ff41"
    if (value < 2.0) return "#fbbf24"
    return "#ff3131"
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#c0c0c0]">Gamma (γ) Limit</p>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-mono font-bold tabular-nums"
            style={{ color: getColor(), textShadow: `0 0 10px ${getColor()}60` }}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-xs font-mono text-[#4b5563]">nats</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute inset-y-0 flex items-center w-full">
          <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${pct}%`,
                background: getColor(),
                boxShadow: `0 0 8px ${getColor()}60`,
              }}
            />
          </div>
        </div>
        {/* Zone markers */}
        <div className="absolute text-[8px] font-mono text-[#374151] flex w-full justify-between px-0 pointer-events-none top-5">
          <span>0.5 STRICT</span>
          <span>1.5 BALANCED</span>
          <span>3.0 LENIENT</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 active:[&::-webkit-slider-thumb]:scale-110"
          style={{
            // @ts-ignore
            "--thumb-border-color": getColor(),
          } as React.CSSProperties}
        />
      </div>
      <div className="mt-6 text-[10px] font-mono text-[#4b5563] flex items-start gap-1.5">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>Queries with Shannon entropy above γ will be intercepted. Lower values = stricter liability protection.</span>
      </div>
    </div>
  )
}

export function SettingsTab({ gammaLimit, onGammaChange, onToast }: SettingsTabProps) {
  const [liabilityShield, setLiabilityShield] = useState(true)
  const [medicalGuardrail, setMedicalGuardrail] = useState(true)
  const [ambiguityMode, setAmbiguityMode] = useState(false)
  const [streamingMode, setStreamingMode] = useState(true)
  const [auditMode, setAuditMode] = useState(true)
  const [telemetry, setTelemetry] = useState(true)

  const handleSave = () => {
    onToast("Settings saved successfully", "success")
  }

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-1">
        <Settings className="w-4 h-4 text-[#00ff41]" />
        <span className="text-sm font-mono text-[#00ff41] tracking-wider">ENTERPRISE SETTINGS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gamma slider */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-[10px] font-mono text-[#4b5563] uppercase tracking-widest mb-5">Intercept Threshold</p>
          <GammaSlider value={gammaLimit} onChange={onGammaChange} />
        </div>

        {/* Socratic mode toggles */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-[10px] font-mono text-[#4b5563] uppercase tracking-widest mb-3">Socratic Mode Guardrails</p>
          <div className="divide-y divide-white/5">
            <Toggle
              label="Liability Shield"
              description="Core entropy-based intercept engine"
              checked={liabilityShield}
              onChange={(v) => { setLiabilityShield(v); onToast(`Liability Shield ${v ? "enabled" : "disabled"}`); }}
              color="green"
            />
            <Toggle
              label="Medical Guardrail"
              description="Block high-risk clinical advice outputs"
              checked={medicalGuardrail}
              onChange={(v) => { setMedicalGuardrail(v); onToast(`Medical Guardrail ${v ? "enabled" : "disabled"}`); }}
              color="red"
            />
            <Toggle
              label="Ambiguity Clarifier"
              description="Request clarification on ambiguous queries"
              checked={ambiguityMode}
              onChange={(v) => { setAmbiguityMode(v); onToast(`Ambiguity Clarifier ${v ? "enabled" : "disabled"}`); }}
              color="blue"
            />
          </div>
        </div>

        {/* Operational toggles */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 backdrop-blur-xl">
          <p className="text-[10px] font-mono text-[#4b5563] uppercase tracking-widest mb-3">Operational Controls</p>
          <div className="divide-y divide-white/5">
            <Toggle
              label="Streaming Mode"
              description="Enable token-level streaming intercept"
              checked={streamingMode}
              onChange={(v) => { setStreamingMode(v); onToast(`Streaming mode ${v ? "on" : "off"}`); }}
              color="green"
            />
            <Toggle
              label="Audit Logging"
              description="Persist all intercepts to immutable log"
              checked={auditMode}
              onChange={(v) => { setAuditMode(v); onToast(`Audit logging ${v ? "enabled" : "disabled"}`); }}
              color="blue"
            />
            <Toggle
              label="Telemetry Export"
              description="Stream metrics to SIEM integration"
              checked={telemetry}
              onChange={(v) => { setTelemetry(v); onToast(`Telemetry export ${v ? "on" : "off"}`); }}
              color="green"
            />
          </div>
        </div>

        {/* Model config */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-4">
          <p className="text-[10px] font-mono text-[#4b5563] uppercase tracking-widest">Engine Configuration</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Engine Version", value: "v2.4.1-stable" },
              { label: "GPU Cluster", value: "T4 x4 (NVIDIA)" },
              { label: "Intercept Latency", value: "~38ms avg" },
              { label: "Tokenizer", value: "tiktoken-cl100k" },
              { label: "Entropy Method", value: "Shannon / Base-2" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs text-[#6b7280]">{item.label}</span>
                <span className="text-xs font-mono text-[#9ca3af]">{item.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="w-full mt-auto bg-[#00ff41]/10 border border-[#00ff41]/25 text-[#00ff41] text-sm font-mono rounded-xl py-2.5 hover:bg-[#00ff41]/20 transition-all duration-200 active:scale-95 glow-green"
          >
            Save Configuration
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#ff3131]/4 border border-[#ff3131]/15 rounded-2xl p-5 backdrop-blur-xl">
        <p className="text-[10px] font-mono text-[#ff3131]/70 uppercase tracking-widest mb-3">Danger Zone</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#c0c0c0]">Reset All Intercept Logs</p>
            <p className="text-xs text-[#4b5563] font-mono">Permanently wipe audit history. This action cannot be undone.</p>
          </div>
          <button
            onClick={() => onToast("Action requires admin confirmation", "warning")}
            className="text-xs font-mono bg-[#ff3131]/10 border border-[#ff3131]/30 text-[#ff3131] px-4 py-2 rounded-lg hover:bg-[#ff3131]/20 transition-all duration-200 active:scale-95"
          >
            Purge Logs
          </button>
        </div>
      </div>
    </div>
  )
}
