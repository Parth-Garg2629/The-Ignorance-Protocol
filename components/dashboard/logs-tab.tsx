"use client"

import { useState } from "react"
import { Download, Bell, Shield, CheckCircle, Clock, Cpu, Filter } from "lucide-react"
import { AuditEntry } from "@/lib/dashboard-store"
import { cn } from "@/lib/utils"

interface LogsTabProps {
  logs: AuditEntry[]
  onToast: (msg: string, type?: "success" | "warning") => void
}

export function LogsTab({ logs, onToast }: LogsTabProps) {
  const [filter, setFilter] = useState<"all" | "pass" | "block">("all")

  const filtered = logs.filter((l) => {
    if (filter === "pass") return l.status === "PASS_GRANTED"
    if (filter === "block") return l.status === "BLOCK_TRIGGERED"
    return true
  })

  const handleExport = () => {
    const header = "id,query,timestamp,entropy,status,model,latency_ms\n"
    const rows = logs
      .map(
        (l) =>
          `${l.id},"${l.query}",${l.timestamp.toISOString()},${l.entropy},${l.status},${l.model},${l.latencyMs}`,
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ignorance-protocol-audit-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onToast("Audit Log Downloaded", "success")
  }

  const handleAlert = () => {
    onToast("SecOps Alert Dispatched", "warning")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-[#00ff41]" />
          <span className="text-sm font-mono text-[#00ff41] tracking-wider">LIABILITY AUDIT LOGS</span>
          <span className="text-[10px] font-mono bg-white/5 border border-white/8 text-[#6b7280] px-2 py-0.5 rounded">
            {logs.length} entries
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex bg-white/4 border border-white/8 rounded-lg p-0.5 gap-0.5 text-[10px] font-mono">
            {(["all", "pass", "block"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all duration-200 uppercase tracking-wider active:scale-95",
                  filter === f
                    ? f === "block"
                      ? "bg-[#ff3131]/20 text-[#ff3131]"
                      : f === "pass"
                      ? "bg-[#00ff41]/15 text-[#00ff41]"
                      : "bg-white/10 text-white"
                    : "text-[#4b5563] hover:text-[#9ca3af]",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={handleAlert}
            className="flex items-center gap-1.5 text-[11px] font-mono bg-[#ff3131]/10 border border-[#ff3131]/25 text-[#ff3131] px-3 py-1.5 rounded-lg hover:bg-[#ff3131]/20 transition-all duration-200 active:scale-95"
          >
            <Bell className="w-3 h-3" />
            Alert
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-[11px] font-mono bg-[#00ff41]/10 border border-[#00ff41]/25 text-[#00ff41] px-3 py-1.5 rounded-lg hover:bg-[#00ff41]/20 transition-all duration-200 active:scale-95"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white/3 border border-white/7 rounded-2xl overflow-hidden backdrop-blur-xl">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/6 text-[9px] font-mono text-[#4b5563] uppercase tracking-widest">
            <div className="col-span-1 flex items-center gap-1"><Filter className="w-2.5 h-2.5" /> #</div>
            <div className="col-span-4">Query</div>
            <div className="col-span-2 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Timestamp</div>
            <div className="col-span-1">H(X)</div>
            <div className="col-span-2 flex items-center gap-1"><Cpu className="w-2.5 h-2.5" /> Model</div>
            <div className="col-span-1">Ms</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/4">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-[#4b5563] font-mono text-xs">
                No entries match filter
              </div>
            )}
            {filtered.map((entry, i) => {
              const isBlock = entry.status === "BLOCK_TRIGGERED"
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-3 text-xs transition-all duration-200 hover:bg-white/3 group",
                    isBlock && "hover:bg-[#ff3131]/4",
                  )}
                >
                  <div className="col-span-1 font-mono text-[#4b5563] group-hover:text-[#6b7280]">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-4 text-[#c0c0c0] font-sans truncate pr-2" title={entry.query}>
                    {entry.query}
                  </div>
                  <div className="col-span-2 font-mono text-[#4b5563] text-[10px]">
                    {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </div>
                  <div
                    className={cn(
                      "col-span-1 font-mono font-bold text-[10px]",
                      isBlock ? "text-[#ff3131]" : entry.entropy < 1 ? "text-[#00ff41]" : "text-[#fbbf24]",
                    )}
                  >
                    {entry.entropy.toFixed(2)}
                  </div>
                  <div className="col-span-2 font-mono text-[#6b7280] text-[10px]">{entry.model}</div>
                  <div className="col-span-1 font-mono text-[#4b5563] text-[10px]">{entry.latencyMs}</div>
                  <div className="col-span-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        isBlock
                          ? "bg-[#ff3131]/10 border-[#ff3131]/30 text-[#ff3131]"
                          : "bg-[#00ff41]/8 border-[#00ff41]/20 text-[#00ff41]",
                      )}
                    >
                      {isBlock ? (
                        <Shield className="w-2 h-2" />
                      ) : (
                        <CheckCircle className="w-2 h-2" />
                      )}
                      {isBlock ? "BLK" : "PSS"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
