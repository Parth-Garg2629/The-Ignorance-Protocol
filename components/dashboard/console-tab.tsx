"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Shield, ChevronDown, Terminal, Wifi, WifiOff } from "lucide-react"
import { ChatMessage, AuditEntry } from "@/lib/dashboard-store"
import { cn } from "@/lib/utils"

interface ConsoleTabProps {
  messages: ChatMessage[]
  onMessagesChange: (msgs: ChatMessage[]) => void
  onNewAuditEntry: (entry: AuditEntry) => void
  onLastActionChange: (action: "PASS_GRANTED" | "BLOCK_TRIGGERED" | null) => void
  onEntropyChange: (v: number) => void
  selectedModel: string
  onModelChange: (m: string) => void
  gammaLimit: number
  demoMode: boolean
}

const MODELS = ["GPT-4o", "Gemma-2b", "Claude 3.5"]
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

// ── Types for API response ────────────────────────────────────────────────────
interface QueryApiResponse {
  status: "allowed" | "blocked"
  response: string
  entropy: number
  confidence: number
  token_entropies: number[]
  latency_ms: number
}

// ── Helper components ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Terminal className="w-3.5 h-3.5 text-[#00ff41]" />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 border border-white/8 bg-white/4 backdrop-blur-xl flex items-center gap-2">
        <span className="text-xs text-[#6b7280] font-mono mr-1">Processing Logits</span>
        <div className="flex gap-1">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#00ff41] inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#00ff41] inline-block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#00ff41] inline-block" />
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({ confidence, entropy }: { confidence: number; entropy: number }) {
  const pct = Math.round(confidence * 100)
  const color = confidence >= 0.6 ? "#00ff41" : confidence >= 0.4 ? "#f59e0b" : "#ff3131"
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-[9px] font-mono text-[#4b5563] uppercase tracking-widest w-16">Confidence</span>
      <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 5px ${color}80` }}
        />
      </div>
      <span className="text-[9px] font-mono tabular-nums" style={{ color }}>{pct}%</span>
      <span className="text-[9px] font-mono text-[#374151]">H={entropy.toFixed(2)}</span>
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user"
  const isBlock = msg.status === "block"
  const isPass = msg.status === "pass"

  const isCode =
    msg.content.startsWith("{") ||
    msg.content.startsWith("[") ||
    msg.content.includes("```")

  const cleanContent = msg.content.replace(/```[\w]*\n?/g, "").replace(/```/g, "")

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Terminal className="w-3.5 h-3.5 text-[#00ff41]" />
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-[#1e3a5f]/80 border border-[#00c4ff]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-[#00c4ff]">U</span>
        </div>
      )}
      <div className="max-w-[72%] flex flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm backdrop-blur-xl border transition-all duration-300",
            isUser
              ? "rounded-tr-sm bg-[#0d2340]/70 border-[#00c4ff]/20 text-[#c8e6ff]"
              : isBlock
                ? "rounded-tl-sm bg-[#1a0808]/80 border-[#ff3131]/30 text-[#ffb3b3] flash-red glow-red"
                : isPass
                  ? "rounded-tl-sm bg-[#081a08]/60 border-[#00ff41]/20 text-[#b3ffcc] glow-green"
                  : "rounded-tl-sm bg-white/4 border-white/8 text-[#d4d4d4]",
          )}
        >
          {isBlock && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#ff3131]/20">
              <Shield className="w-3.5 h-3.5 text-[#ff3131]" />
              <span className="text-[10px] font-mono font-bold text-[#ff3131] tracking-widest uppercase glow-text-red">
                BLOCK_TRIGGERED
              </span>
            </div>
          )}
          {isPass && !isUser && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold text-[#00ff41] tracking-widest uppercase glow-text-green">
                PASS_GRANTED
              </span>
            </div>
          )}
          {isCode && !isUser ? (
            <pre className="font-mono text-xs bg-black/40 rounded-lg p-3 overflow-x-auto text-[#00ff41] leading-relaxed whitespace-pre-wrap">
              {cleanContent}
            </pre>
          ) : (
            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Confidence bar — shown for non-user messages that have entropy */}
        {!isUser && msg.entropy !== undefined && msg.confidence !== undefined && (
          <div className="px-1">
            <ConfidenceBar confidence={msg.confidence} entropy={msg.entropy} />
          </div>
        )}

        <div className={cn("flex items-center gap-2 text-[10px] text-[#4b5563] font-mono px-1", isUser && "flex-row-reverse")}>
          <span>
            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {msg.entropy !== undefined && (
            <>
              <span>·</span>
              <span>H={msg.entropy.toFixed(2)}</span>
            </>
          )}
          {msg.model && (
            <>
              <span>·</span>
              <span>{msg.model}</span>
            </>
          )}
          {msg.latencyMs !== undefined && (
            <>
              <span>·</span>
              <span>{msg.latencyMs}ms</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Demo mode logic (unchanged from original) ─────────────────────────────────
function buildDemoResponse(
  trimmed: string,
  selectedModel: string,
  gammaLimit: number,
): {
  entropy: number
  blocked: boolean
  content: string
  latencyMs: number
} {
  const lower = trimmed.toLowerCase()
  const isCalc = lower === "compute 73 x 19" || lower === "compute 73x19"
  const isPolicy = lower.includes("air canada") && lower.includes("refund")

  if (isCalc) {
    const entropy = parseFloat((Math.random() * 0.3 + 0.05).toFixed(2))
    return { entropy, blocked: false, content: "1387", latencyMs: 19 }
  }
  if (isPolicy) {
    const entropy = parseFloat((Math.random() * 0.4 + 2.6).toFixed(2))
    return {
      entropy,
      blocked: true,
      content: "🚨 SYSTEM INTERCEPT: High epistemic uncertainty detected. Liability shield engaged.",
      latencyMs: 38,
    }
  }
  const entropy = parseFloat((Math.random() * 1.8 + 0.2).toFixed(2))
  const blocked = entropy > gammaLimit
  const responses = [
    `I've analyzed your query. Shannon entropy H=${entropy.toFixed(2)} is within acceptable bounds. Response confidence: HIGH.`,
    `Query processed. Semantic validation complete. No epistemic anomalies detected. H=${entropy.toFixed(2)}.`,
    `{\n  "status": "PASS",\n  "confidence": ${(1 - entropy / 3).toFixed(3)},\n  "entropy_score": ${entropy.toFixed(2)},\n  "model": "${selectedModel}"\n}`,
  ]
  const content = blocked
    ? `🚨 SYSTEM INTERCEPT: Entropy score H=${entropy.toFixed(2)} exceeds γ-limit of ${gammaLimit.toFixed(1)}. Liability shield engaged.`
    : responses[Math.floor(Math.random() * responses.length)]
  return { entropy, blocked, content, latencyMs: Math.floor(Math.random() * 200 + 20) }
}

// ── Main component ────────────────────────────────────────────────────────────
export function ConsoleTab({
  messages,
  onMessagesChange,
  onNewAuditEntry,
  onLastActionChange,
  onEntropyChange,
  selectedModel,
  onModelChange,
  gammaLimit,
  demoMode,
}: ConsoleTabProps) {
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Health-check backend when switching to Live mode
  useEffect(() => {
    if (demoMode) {
      setBackendOnline(null)
      return
    }
    fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((d) => setBackendOnline(d.status === "ok"))
      .catch(() => setBackendOnline(false))
  }, [demoMode])

  const processMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        status: "neutral",
        timestamp: new Date(),
      }
      onMessagesChange([...messages, userMsg])
      setInput("")
      setIsTyping(true)

      try {
        let entropy: number
        let blocked: boolean
        let content: string
        let confidence: number
        let latencyMs: number

        if (demoMode) {
          // ── Demo mode: simulated responses ──────────────────────────────────
          await new Promise((r) =>
            setTimeout(r, trimmed.toLowerCase() === "compute 73 x 19" ? 400 : 1000 + Math.random() * 800),
          )
          const demo = buildDemoResponse(trimmed, selectedModel, gammaLimit)
          entropy = demo.entropy
          blocked = demo.blocked
          content = demo.content
          confidence = parseFloat((1 - entropy / 3).toFixed(4))
          latencyMs = demo.latencyMs
        } else {
          // ── Live API mode: real backend call ────────────────────────────────
          const res = await fetch(`${API_URL}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: trimmed, gamma: gammaLimit }),
            signal: AbortSignal.timeout(120_000), // 2 min for slow models
          })

          if (!res.ok) {
            throw new Error(`Backend returned ${res.status}`)
          }
          const data: QueryApiResponse = await res.json()
          entropy = data.entropy
          blocked = data.status === "blocked"
          content = data.response
          confidence = data.confidence
          latencyMs = data.latency_ms
        }

        setIsTyping(false)
        onEntropyChange(entropy)
        onLastActionChange(blocked ? "BLOCK_TRIGGERED" : "PASS_GRANTED")

        const sysMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "system",
          content,
          status: blocked ? "block" : "pass",
          timestamp: new Date(),
          entropy,
          confidence,
          latencyMs,
          model: selectedModel,
        }
        onMessagesChange([...messages, userMsg, sysMsg])
        onNewAuditEntry({
          id: crypto.randomUUID(),
          query: trimmed,
          timestamp: new Date(),
          entropy,
          status: blocked ? "BLOCK_TRIGGERED" : "PASS_GRANTED",
          model: selectedModel,
          latencyMs,
        })
      } catch (err) {
        setIsTyping(false)
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "system",
          content: `⚠️ Backend connection failed. Make sure the Flask server is running at ${API_URL}.\n\nError: ${err instanceof Error ? err.message : String(err)}`,
          status: "block",
          timestamp: new Date(),
          model: selectedModel,
        }
        onMessagesChange([...messages, userMsg, errorMsg])
      }
    },
    [messages, onMessagesChange, onNewAuditEntry, onLastActionChange, onEntropyChange, selectedModel, gammaLimit, demoMode],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      processMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/6">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#00ff41]" />
          <span className="text-sm font-mono text-[#00ff41] tracking-wider">INTERCEPT CONSOLE</span>
          <span className="text-[10px] font-mono text-[#4b5563] bg-white/5 px-2 py-0.5 rounded border border-white/8">
            γ-LIMIT: {gammaLimit.toFixed(1)}
          </span>
          {/* Backend status indicator in Live mode */}
          {!demoMode && (
            <div className="flex items-center gap-1.5">
              {backendOnline === true && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/20 px-2 py-0.5 rounded">
                  <Wifi className="w-2.5 h-2.5" /> API LIVE
                </span>
              )}
              {backendOnline === false && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-[#ff3131] bg-[#ff3131]/10 border border-[#ff3131]/20 px-2 py-0.5 rounded">
                  <WifiOff className="w-2.5 h-2.5" /> API OFFLINE
                </span>
              )}
              {backendOnline === null && (
                <span className="text-[9px] font-mono text-[#4b5563] animate-pulse">connecting…</span>
              )}
            </div>
          )}
        </div>
        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setModelOpen((o) => !o)}
            className="flex items-center gap-2 text-xs font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[#c0c0c0] hover:bg-white/10 hover:border-[#00ff41]/30 transition-all duration-300 active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />
            {selectedModel}
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", modelOpen && "rotate-180")} />
          </button>
          {modelOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#0d0d0d]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
              {MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => { onModelChange(m); setModelOpen(false) }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-xs font-mono transition-all duration-150 flex items-center gap-2",
                    selectedModel === m
                      ? "text-[#00ff41] bg-[#00ff41]/8"
                      : "text-[#9ca3af] hover:bg-white/5 hover:text-white",
                  )}
                >
                  {selectedModel === m && <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />}
                  {selectedModel !== m && <span className="w-1.5 h-1.5 rounded-full border border-white/20" />}
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
            <div className="w-14 h-14 rounded-2xl bg-[#00ff41]/8 border border-[#00ff41]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#00ff41]" />
            </div>
            <div>
              <p className="text-sm text-[#9ca3af] font-mono">Liability shield active</p>
              {demoMode ? (
                <p className="text-xs text-[#4b5563] mt-1">
                  Try: <span className="text-[#00c4ff]/70">&quot;Compute 73 x 19&quot;</span> or{" "}
                  <span className="text-[#ff3131]/70">&quot;What is Air Canada&apos;s refund policy?&quot;</span>
                </p>
              ) : (
                <p className="text-xs text-[#4b5563] mt-1">
                  Live API mode — entropy computed from real model logits
                </p>
              )}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/6">
        <div className="flex items-end gap-3 bg-white/4 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#00ff41]/30 focus-within:bg-white/6 transition-all duration-300">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={demoMode ? "Enter prompt to intercept (demo)…" : "Enter prompt for live entropy analysis…"}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#e8e8e8] placeholder-[#4b5563] font-sans resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: "22px" }}
          />
          <button
            onClick={() => processMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-xl bg-[#00ff41] flex items-center justify-center hover:bg-[#00cc35] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-[#050505]" />
          </button>
        </div>
        <p className="text-[10px] text-[#374151] font-mono text-center mt-2">
          SHIFT+ENTER for newline · ENTER to send
        </p>
      </div>
    </div>
  )
}
