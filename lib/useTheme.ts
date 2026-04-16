"use client"

import { useEffect, useState } from "react"

/** Observa a classe `dark` no <html> e retorna true quando ativa. */
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return dark
}
