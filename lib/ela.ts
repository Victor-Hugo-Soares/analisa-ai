/**
 * Error Level Analysis (ELA) — forensic technique to detect JPEG manipulation.
 *
 * How it works:
 *   1. Re-save the image at a known JPEG quality (e.g. 75 %).
 *   2. Compute the per-pixel absolute difference between the original and the
 *      re-saved version.
 *   3. Amplify the differences by a scale factor so subtle edits become visible.
 *
 * Edited regions compress differently than the original content, so they show
 * up brighter in the resulting ELA map.
 *
 * Limitations:
 *   - PNG / WebP inputs are losslessly decoded; ELA still works but the
 *     baseline noise floor is higher because there were no prior JPEG artefacts.
 *   - The technique is most reliable on images that were originally JPEG.
 */

export interface ElaOptions {
  /** JPEG re-save quality, 0–1. Lower = more amplification. Default 0.75 */
  quality?: number
  /** Pixel-difference multiplier, 1–50. Higher = brighter output. Default 15 */
  scale?: number
}

export interface ElaResult {
  /** Data URL of the ELA heat-map (PNG) */
  dataUrl: string
  /** Mean error level across all pixels, 0–255 */
  meanError: number
  /** Max error level found, 0–255 */
  maxError: number
  /** Fraction of pixels with error above the anomaly threshold */
  anomalyRatio: number
}

/**
 * Computes an ELA heat-map for the supplied image source (data URL or object URL).
 * Must be called in a browser environment (needs Canvas & createImageBitmap).
 */
export async function computeEla(
  src: string,
  options: ElaOptions = {}
): Promise<ElaResult> {
  const quality = options.quality ?? 0.75
  const scale = options.scale ?? 15

  // --- 1. Load original into an ImageBitmap ---
  const original = await loadImage(src)
  const { width, height } = original

  // --- 2. Draw original → canvas → re-export as JPEG ---
  const canvasA = makeCanvas(width, height)
  const ctxA = canvasA.getContext("2d")!
  ctxA.drawImage(original, 0, 0)
  const dataA = ctxA.getImageData(0, 0, width, height)

  const recompressed = await reencodeAsJpeg(canvasA, quality)
  const canvasB = makeCanvas(width, height)
  const ctxB = canvasB.getContext("2d")!
  ctxB.drawImage(recompressed, 0, 0)
  const dataB = ctxB.getImageData(0, 0, width, height)

  // --- 3. Compute amplified difference ---
  const output = ctxA.createImageData(width, height)
  let totalError = 0
  let maxError = 0
  let anomalyCount = 0
  // Anomaly threshold: scaled error > 128 (half the 0-255 range)
  const anomalyThreshold = 128

  for (let i = 0; i < dataA.data.length; i += 4) {
    const dr = Math.abs(dataA.data[i]     - dataB.data[i])
    const dg = Math.abs(dataA.data[i + 1] - dataB.data[i + 1])
    const db = Math.abs(dataA.data[i + 2] - dataB.data[i + 2])

    // Luminance-weighted error
    const err = (dr * 0.299 + dg * 0.587 + db * 0.114)
    const amplified = Math.min(err * scale, 255)

    totalError += err
    if (err > maxError) maxError = err
    if (amplified > anomalyThreshold) anomalyCount++

    // Heat-map colouring: dark blue → cyan → yellow → red
    const { r, g, b } = heatColor(amplified / 255)
    output.data[i]     = r
    output.data[i + 1] = g
    output.data[i + 2] = b
    output.data[i + 3] = 255
  }

  const pixelCount = (dataA.data.length / 4)
  const meanError = totalError / pixelCount

  // Write output to a new canvas and export as PNG
  const canvasOut = makeCanvas(width, height)
  canvasOut.getContext("2d")!.putImageData(output, 0, 0)

  return {
    dataUrl: canvasOut.toDataURL("image/png"),
    meanError,
    maxError,
    anomalyRatio: anomalyCount / pixelCount,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function reencodeAsJpeg(canvas: HTMLCanvasElement, quality: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const jpegUrl = canvas.toDataURL("image/jpeg", quality)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = jpegUrl
  })
}

/**
 * Maps a 0–1 intensity to a thermal heat-map colour (dark blue → red).
 */
function heatColor(t: number): { r: number; g: number; b: number } {
  // Colour stops: 0 → #0d1117 (near-black), 0.33 → #0ea5e9 (cyan), 0.66 → #facc15 (yellow), 1 → #ef4444 (red)
  if (t < 0.33) {
    const u = t / 0.33
    return { r: Math.round(13 + u * (14 - 13)), g: Math.round(17 + u * (165 - 17)), b: Math.round(23 + u * (233 - 23)) }
  }
  if (t < 0.66) {
    const u = (t - 0.33) / 0.33
    return { r: Math.round(14 + u * (250 - 14)), g: Math.round(165 + u * (204 - 165)), b: Math.round(233 + u * (21 - 233)) }
  }
  const u = (t - 0.66) / 0.34
  return { r: Math.round(250 + u * (239 - 250)), g: Math.round(204 + u * (68 - 204)), b: Math.round(21 + u * (68 - 21)) }
}
