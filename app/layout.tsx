import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Analisa Aí - Análise Inteligente de Sinistros",
  description:
    "Plataforma SaaS para análise de sinistros veiculares com Inteligência Artificial",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
