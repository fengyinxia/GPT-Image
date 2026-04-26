const SIZE_PATTERN = /^\s*(\d+)\s*[xX×]\s*(\d+)\s*$/
const RATIO_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*[:xX×]\s*(\d+(?:\.\d+)?)\s*$/

export type SizeTier = '1K' | '2K' | '4K'

const STANDARD_BASE_SIZES: Record<SizeTier, { width: number; height: number }> = {
  '1K': { width: 1920, height: 1080 },
  '2K': { width: 2560, height: 1440 },
  '4K': { width: 3840, height: 2160 },
}

function roundToMultiple(value: number, multiple: number) {
  return Math.max(multiple, Math.round(value / multiple) * multiple)
}

function floorToMultiple(value: number, multiple: number) {
  return Math.max(multiple, Math.floor(value / multiple) * multiple)
}

export function normalizeImageSize(size: string) {
  const trimmed = size.trim()
  const match = trimmed.match(SIZE_PATTERN)
  if (!match) return trimmed

  const width = roundToMultiple(Number(match[1]), 16)
  const height = roundToMultiple(Number(match[2]), 16)
  return `${width}x${height}`
}

export function parseRatio(ratio: string) {
  const match = ratio.match(RATIO_PATTERN)
  if (!match) return null

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return { width, height }
}

export function formatImageRatio(width: number, height: number) {
  const roundedWidth = Math.round(width)
  const roundedHeight = Math.round(height)
  if (
    !Number.isFinite(roundedWidth) ||
    !Number.isFinite(roundedHeight) ||
    roundedWidth <= 0 ||
    roundedHeight <= 0
  ) {
    return ''
  }

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(roundedWidth, roundedHeight)
  const simplifiedWidth = roundedWidth / divisor
  const simplifiedHeight = roundedHeight / divisor
  const simplified = `${simplifiedWidth}:${simplifiedHeight}`
  const commonRatios = [
    [1, 1],
    [4, 3],
    [3, 4],
    [3, 2],
    [2, 3],
    [16, 9],
    [9, 16],
    [21, 9],
    [9, 21],
  ]

  for (const [commonWidth, commonHeight] of commonRatios) {
    if (simplifiedWidth === commonWidth && simplifiedHeight === commonHeight) {
      return simplified
    }
  }

  const actualRatio = roundedWidth / roundedHeight
  const nearest = commonRatios
    .map(([commonWidth, commonHeight]) => {
      const ratio = commonWidth / commonHeight
      return {
        label: `${commonWidth}:${commonHeight}`,
        delta: Math.abs(actualRatio - ratio) / ratio,
      }
    })
    .sort((a, b) => a.delta - b.delta)[0]

  return nearest && nearest.delta <= 0.01 ? `≈${nearest.label}` : simplified
}

export function calculateImageSize(tier: SizeTier, ratio: string) {
  const parsed = parseRatio(ratio)
  if (!parsed) return null

  const { width: ratioWidth, height: ratioHeight } = parsed
  const base = STANDARD_BASE_SIZES[tier]
  const basePixels = base.width * base.height
  const ratioScale = Math.sqrt(basePixels / (ratioWidth * ratioHeight))
  const width = floorToMultiple(ratioWidth * ratioScale, 16)
  const height = floorToMultiple(ratioHeight * ratioScale, 16)
  return `${width}x${height}`
}
