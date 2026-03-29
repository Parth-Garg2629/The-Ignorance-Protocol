import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Ignorance Protocol — AI Liability Shield',
  description: 'Enterprise-grade AI latency control engine and liability shield. Intercept, analyze, and neutralize high-entropy AI outputs in real time.',
  generator: 'v0.app',
  keywords: ['AI Security', 'Liability Shield', 'Latency Control', 'Enterprise AI'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#050505] text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
