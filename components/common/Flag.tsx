import type { CountryCode } from '@/types/country'
import { cn } from '@/lib/utils/cn'

/**
 * Small flag icons drawn as SVG. Flag emoji are not an option: Windows renders
 * them as plain letters ("CO"), so they would look broken for many visitors.
 * Simplified for a 20×14 size — proportions and colours are faithful, fine
 * detail (US stars, the full maple leaf) is reduced to what reads at that size.
 */
export function Flag({ code, className }: { code: CountryCode; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      aria-hidden
      className={cn('h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15', className)}
    >
      {code === 'co' && (
        <>
          {/* Colombia: yellow over half, then blue and red. */}
          <rect width="20" height="7" fill="#FCD116" />
          <rect y="7" width="20" height="3.5" fill="#003893" />
          <rect y="10.5" width="20" height="3.5" fill="#CE1126" />
        </>
      )}

      {code === 'us' && (
        <>
          {/* United States: 13 stripes and a blue canton with a hint of stars. */}
          <rect width="20" height="14" fill="#FFFFFF" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={i * (14 / 6.5)} width="20" height={14 / 13} fill="#B22234" />
          ))}
          <rect width="8.5" height={(14 / 13) * 7} fill="#3C3B6E" />
          {[1.6, 4.25, 6.9].flatMap((x) =>
            [1.6, 3.8, 6].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#FFFFFF" />),
          )}
        </>
      )}

      {code === 'ca' && (
        <>
          {/* Canada: red bands at each side, white centre with a maple leaf. */}
          <rect width="20" height="14" fill="#FFFFFF" />
          <rect width="5" height="14" fill="#D52B1E" />
          <rect x="15" width="5" height="14" fill="#D52B1E" />
          <path
            d="M10 3.1l.7 1.3 .8-.3-.3 1.9 1-.9.2.6 1.1-.2-.4 1.2.5.2-1.9 1.5.2.6-1.6-.3V10h-.5V8.7l-1.6.3.2-.6-1.9-1.5.5-.2-.4-1.2 1.1.2.2-.6 1 .9-.3-1.9.8.3z"
            fill="#D52B1E"
          />
        </>
      )}
    </svg>
  )
}
