import type { Metadata } from "next"
import "./globals.css"

const BASE_URL = "https://ianalista.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "IAnalista — Análise de Eventos Veiculares com IA",
    template: "%s | IAnalista",
  },
  description:
    "Plataforma com IA para análise de eventos veiculares. Detecte fraudes, transcreva áudios automaticamente e tome decisões assertivas em segundos.",
  keywords: [
    "análise de sinistros",
    "detecção de fraude veicular",
    "sinistros veiculares",
    "IA para proteção veicular",
    "análise de sinistros com inteligência artificial",
    "proteção veicular",
    "análise de fraude",
    "seguro veicular",
    "SaaS proteção veicular",
  ],
  authors: [{ name: "IAnalista", url: BASE_URL }],
  creator: "IAnalista",
  publisher: "IAnalista",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: BASE_URL,
    siteName: "IAnalista",
    title: "IAnalista — Análise de Eventos Veiculares com IA",
    description:
      "Detecte fraudes, transcreva áudios e analise eventos em segundos com IA. Plataforma para proteções veiculares.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IAnalista — Análise de Eventos Veiculares com IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IAnalista — Análise de Eventos Veiculares com IA",
    description:
      "Detecte fraudes, transcreva áudios e analise eventos em segundos com IA.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  // Google Search Console — preencher após verificação
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "",
  },
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
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "IAnalista",
              url: BASE_URL,
              description:
                "Plataforma com IA para análise de eventos veiculares. Detecte fraudes e tome decisões assertivas em segundos.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
                description: "Acesso sob contrato",
              },
              provider: {
                "@type": "Organization",
                name: "IAnalista",
                url: BASE_URL,
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
