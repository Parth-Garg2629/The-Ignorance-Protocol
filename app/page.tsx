"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Terminal,
  Activity,
  FileText,
  TrendingDown,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TabId, ChatMessage, AuditEntry, INITIAL_AUDIT_LOGS } from "@/lib/dashboard-store"
import { ConsoleTab } from "@/components/dashboard/console-tab"
import { TelemetryTab } from "@/components/dashboard/telemetry-tab"
import { LogsTab } from "@/components/dashboard/logs-tab"
import { OpexTab } from "@/components/dashboard/opex-tab"
import { SettingsTab } from "@/components/dashboard/settings-tab"

interface ToastMsg {
  id: string
  message: string
  type: "success" | "warning" | "info"
}

const NAV_ITEMS: { id: TabId; label: string; short: string; Icon: React.ElementType }[] = [
  { id: "console", label: "Live Intercept Console", short: "Console", Icon: Terminal },
  { id: "telemetry", label: "Telemetry & Entropy Matrix", short: "Telemetry", Icon: Activity },
  { id: "logs", label: "Liability Audit Logs", short: "Audit Logs", Icon: FileText },
  { id: "opex", label: "OPEX & Green AI Impact", short: "OPEX", Icon: TrendingDown },
  { id: "settings", label: "Enterprise Settings", short: "Settings", Icon: Settings },
]

function LiveClock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }))
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="font-mono text-[10px] text-[#4b5563] tabular-nums">{time}</span>
}

function Toast({ toast, onClose }: { toast: ToastMsg; onClose: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onClose])

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-[#00ff41]" />,
    warning: <XCircle className="w-4 h-4 text-[#ff3131]" />,
    info: <Shield className="w-4 h-4 text-[#00c4ff]" />,
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl text-sm font-sans shadow-2xl transition-all duration-300 animate-in slide-in-from-right-4 fade-in",
        toast.type === "success"
          ? "bg-[#081a08]/90 border-[#00ff41]/25 text-[#b3ffcc]"
          : toast.type === "warning"
            ? "bg-[#1a0808]/90 border-[#ff3131]/25 text-[#ffb3b3]"
            : "bg-[#08101a]/90 border-[#00c4ff]/25 text-[#b3e8ff]",
      )}
    >
      {icons[toast.type]}
      <span>{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="ml-2 text-[#4b5563] hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("console")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [demoMode, setDemoMode] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS)
  const [lastAction, setLastAction] = useState<"PASS_GRANTED" | "BLOCK_TRIGGERED" | null>(null)
  const [entropy, setEntropy] = useState(0.74)
  const [gammaLimit, setGammaLimit] = useState(1.8)
  const [selectedModel, setSelectedModel] = useState("GPT-4o")
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [interceptCount, setInterceptCount] = useState(0)

  const addToast = useCallback((message: string, type: "success" | "warning" | "info" = "info") => {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const handleNewAuditEntry = useCallback((entry: AuditEntry) => {
    setAuditLogs((prev) => [entry, ...prev])
    if (entry.status === "BLOCK_TRIGGERED") {
      setInterceptCount((c) => c + 1)
    }
  }, [])

  // Entropy drift when idle
  useEffect(() => {
    const interval = setInterval(() => {
      setEntropy((prev) => {
        const drift = (Math.random() - 0.5) * 0.08
        return Math.max(0.05, Math.min(2.95, parseFloat((prev + drift).toFixed(2))))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const blockCount = auditLogs.filter((l) => l.status === "BLOCK_TRIGGERED").length

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#050505]">
      {/* Background dot grid */}
      <div className="absolute inset-0 dot-grid pointer-events-none opacity-60" />
      {/* Background mesh glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vh] rounded-full bg-[#00ff41]/[0.025] blur-[120px] pointer-events-none mesh-drift" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[50vh] rounded-full bg-[#00c4ff]/[0.02] blur-[100px] pointer-events-none" />

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "relative z-20 flex flex-col h-full border-r border-white/6 bg-black/50 backdrop-blur-2xl transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-white/6", sidebarCollapsed && "justify-center px-3")}>
          <div className="relative w-8 h-8 rounded-lg bg-[#00ff41]/10 border border-[#00ff41]/25 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#00ff41]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00ff41] pulse-green" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-tight truncate">THE IGNORANCE</p>
              <p className="text-[10px] font-mono text-[#00ff41] glow-text-green tracking-widest">PROTOCOL</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, short, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-sans transition-all duration-200 active:scale-95 text-left w-full",
                  isActive
                    ? "bg-[#00ff41]/10 border border-[#00ff41]/20 text-[#00ff41]"
                    : "text-[#6b7280] border border-transparent hover:bg-white/5 hover:text-[#c0c0c0]",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-all duration-200",
                    isActive ? "text-[#00ff41]" : "text-[#4b5563] group-hover:text-[#9ca3af]",
                  )}
                  style={isActive ? { filter: "drop-shadow(0 0 6px rgba(0,255,65,0.6))" } : {}}
                />
                {!sidebarCollapsed && <span className="truncate text-xs">{short}</span>}
                {isActive && !sidebarCollapsed && (
                  <span className="ml-auto w-1 h-1 rounded-full bg-[#00ff41] flex-shrink-0" />
                )}
              </button>
            )
          })}
        </nav>

        {/* Entropy mini gauge in sidebar */}
        {!sidebarCollapsed && (
          <div className="px-3 pb-3 border-t border-white/6 pt-3">
            <div className="bg-white/3 rounded-xl p-3 border border-white/6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-[#4b5563] uppercase tracking-widest">H(X) Live</span>
                <span
                  className={cn(
                    "text-sm font-mono font-bold tabular-nums",
                    entropy > gammaLimit ? "text-[#ff3131] glow-text-red" : "text-[#00ff41] glow-text-green",
                  )}
                >
                  {entropy.toFixed(2)}
                </span>
              </div>
              <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((entropy / 3) * 100, 100)}%`,
                    background: entropy > gammaLimit ? "#ff3131" : "#00ff41",
                    boxShadow: entropy > gammaLimit ? "0 0 6px rgba(255,49,49,0.6)" : "0 0 6px rgba(0,255,65,0.5)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-mono text-[#374151]">0.0</span>
                <span className="text-[8px] font-mono text-[#374151]">γ={gammaLimit.toFixed(1)}</span>
                <span className="text-[8px] font-mono text-[#374151]">3.0</span>
              </div>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center hover:bg-[#00ff41]/10 hover:border-[#00ff41]/30 transition-all duration-200 z-30 active:scale-95"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3 text-[#6b7280]" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-[#6b7280]" />
          )}
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between gap-3 px-5 py-3 border-b border-white/6 bg-black/30 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs font-mono text-[#4b5563]">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <LiveClock />

            {/* Last action badge */}
            {lastAction && (
              <div
                className={cn(
                  "hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded-lg border",
                  lastAction === "PASS_GRANTED"
                    ? "bg-[#00ff41]/8 border-[#00ff41]/25 text-[#00ff41] glow-green"
                    : "bg-[#ff3131]/10 border-[#ff3131]/30 text-[#ff3131] glow-red",
                )}
              >
                {lastAction === "PASS_GRANTED" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Shield className="w-3 h-3" />
                )}
                {lastAction}
              </div>
            )}

            {/* Intercept count */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono bg-white/4 border border-white/8 text-[#6b7280] px-2.5 py-1.5 rounded-lg">
              <Shield className="w-3 h-3 text-[#ff3131]" />
              {blockCount} intercepts
            </div>

            {/* Demo mode toggle */}
            <div className="flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-mono text-[#4b5563]">
                {demoMode ? "Cached Demo" : "Live API"}
              </span>
              <button
                role="switch"
                aria-checked={demoMode}
                onClick={() => { setDemoMode((d) => !d); addToast(`Switched to ${demoMode ? "Live API" : "Cached Demo"} mode`, "info"); }}
                className={cn(
                  "relative w-8 h-4 rounded-full border transition-all duration-300 active:scale-95",
                  demoMode ? "bg-[#00c4ff]/60 border-[#00c4ff]/30" : "bg-white/8 border-white/10",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-300",
                    demoMode ? "left-[18px]" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {/* Live status pill */}
            <div className="flex items-center gap-2 bg-[#00ff41]/6 border border-[#00ff41]/20 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff41] pulse-green flex-shrink-0" />
              <span className="text-[10px] font-mono text-[#00ff41] hidden sm:inline whitespace-nowrap">
                Live Connection: T4 GPU Engine
              </span>
              <span className="text-[10px] font-mono text-[#00ff41] sm:hidden">LIVE</span>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === "console" && (
            <ConsoleTab
              messages={messages}
              onMessagesChange={setMessages}
              onNewAuditEntry={handleNewAuditEntry}
              onLastActionChange={setLastAction}
              onEntropyChange={setEntropy}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              gammaLimit={gammaLimit}
              demoMode={demoMode}
            />
          )}
          {activeTab === "telemetry" && (
            <TelemetryTab
              entropy={entropy}
              lastAction={lastAction}
              gammaLimit={gammaLimit}
              interceptCount={interceptCount}
            />
          )}
          {activeTab === "logs" && (
            <LogsTab
              logs={auditLogs}
              onToast={addToast}
            />
          )}
          {activeTab === "opex" && (
            <OpexTab
              logs={auditLogs}
              interceptCount={interceptCount}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              gammaLimit={gammaLimit}
              onGammaChange={setGammaLimit}
              onToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </div>
  )
}
