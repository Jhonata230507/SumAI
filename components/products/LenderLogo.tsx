import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

/** Tile colours for lender initials, picked by name so a lender keeps its colour. */
const TILES = [
  'from-[#ffa07f] to-[#f2603a]',
  'from-[#8b8af0] to-[#4a49c2]',
  'from-[#4fd1a2] to-[#14906a]',
  'from-[#6aa8f5] to-[#2a6fd0]',
  'from-[#f5c46a] to-[#d08a2a]',
]

const SIZES = { sm: 'h-8 w-8 rounded-lg text-[11px]', md: 'h-10 w-10 rounded-xl text-sm', lg: 'h-12 w-12 rounded-xl text-base' }
const PIXELS = { sm: 32, md: 40, lg: 48 }

/**
 * A lender's image: its logo when the catalogue has one, otherwise its initials
 * on a coloured tile (always the same colour for the same lender).
 */
export function LenderLogo({
  name,
  logoUrl,
  size = 'md',
  className,
}: {
  name: string
  logoUrl?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt=""
        width={PIXELS[size]}
        height={PIXELS[size]}
        className={cn('shrink-0 bg-white object-contain p-1', SIZES[size], className)}
      />
    )
  }
  const tile = TILES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TILES.length]
  const initials = name
    .split(' ')
    .filter((word) => /\p{L}/u.test(word[0] ?? ''))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]',
        SIZES[size],
        tile,
        className,
      )}
    >
      {initials}
    </span>
  )
}
