import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "IAnalista - Análise Inteligente de Sinistros Veiculares",
  description:
    "Plataforma SaaS com IA para análise de sinistros veiculares. Detecte fraudes, elimine filas e tome decisões assertivas em segundos.",
  metadataBase: new URL("https://ianalista.com"),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}

