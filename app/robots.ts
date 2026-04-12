import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/sinistros",
          "/relatorios",
          "/configuracoes",
          "/admin",
          "/cadastro",
          "/login",
          "/debug",
          "/api/",
        ],
      },
    ],
    sitemap: "https://ianalista.com/sitemap.xml",
  }
}
