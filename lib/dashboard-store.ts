"use client"

export type TabId = "console" | "telemetry" | "logs" | "opex" | "settings"

export type MessageRole = "user" | "system"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  status?: "pass" | "block" | "neutral"
  timestamp: Date
  entropy?: number
  confidence?: number
  latencyMs?: number
  model?: string
}

export interface AuditEntry {
  id: string
  query: string
  timestamp: Date
  entropy: number
  status: "PASS_GRANTED" | "BLOCK_TRIGGERED"
  model: string
  latencyMs: number
}

export const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "a1",
    query: "Summarize Q3 earnings report",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    entropy: 0.82,
    status: "PASS_GRANTED",
    model: "GPT-4o",
    latencyMs: 142,
  },
  {
    id: "a2",
    query: "What is Air Canada's refund policy?",
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    entropy: 2.91,
    status: "BLOCK_TRIGGERED",
    model: "Gemma-2b",
    latencyMs: 38,
  },
  {
    id: "a3",
    query: "Compute 73 x 19",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    entropy: 0.11,
    status: "PASS_GRANTED",
    model: "GPT-4o",
    latencyMs: 19,
  },
  {
    id: "a4",
    query: "What are the side effects of ibuprofen?",
    timestamp: new Date(Date.now() - 1000 * 60 * 32),
    entropy: 2.44,
    status: "BLOCK_TRIGGERED",
    model: "Claude 3.5",
    latencyMs: 55,
  },
  {
    id: "a5",
    query: "List top 5 cloud providers by revenue",
    timestamp: new Date(Date.now() - 1000 * 60 * 58),
    entropy: 1.04,
    status: "PASS_GRANTED",
    model: "Claude 3.5",
    latencyMs: 188,
  },
  {
    id: "a6",
    query: "Explain our SLA obligations to Tier-1 clients",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    entropy: 2.78,
    status: "BLOCK_TRIGGERED",
    model: "GPT-4o",
    latencyMs: 44,
  },
  {
    id: "a7",
    query: "Draft email subject line for product launch",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    entropy: 0.67,
    status: "PASS_GRANTED",
    model: "Gemma-2b",
    latencyMs: 95,
  },
  {
    id: "a8",
    query: "What is the capital of France?",
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    entropy: 0.05,
    status: "PASS_GRANTED",
    model: "Gemma-2b",
    latencyMs: 12,
  },
]

export const TELEMETRY_HISTORY = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  entropy: parseFloat((Math.random() * 2.5 + 0.3).toFixed(2)),
  intercepts: Math.floor(Math.random() * 8),
  tokens: Math.floor(Math.random() * 4000 + 500),
}))
