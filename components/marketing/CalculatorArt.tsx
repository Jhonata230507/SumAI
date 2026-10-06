import type { CalculatorId } from '@/types/common'

/**
 * Illustrations for the calculator carousel, one per calculator.
 *
 * Hand-drawn SVG rather than raster images: crisp at any size and density,
 * a few kilobytes each, and built from the site palette (coral primary,
 * indigo accent, the blue / aqua chart hues) so the six read as one family.
 * Each is a small scene with soft gradients and a highlight for depth.
 * Decorative only — the card's text carries the meaning.
 */
export function CalculatorArt({ id, className }: { id: CalculatorId; className?: string }) {
  const Scene = SCENES[id]
  return (
    <svg viewBox="0 0 300 220" aria-hidden className={className} fill="none">
      <defs>
        <linearGradient id="art-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffa07f" />
          <stop offset="100%" stopColor="#f2603a" />
        </linearGradient>
        <linearGradient id="art-indigo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b8af0" />
          <stop offset="100%" stopColor="#4a49c2" />
        </linearGradient>
        <linearGradient id="art-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5fa6f2" />
          <stop offset="100%" stopColor="#2a6fd0" />
        </linearGradient>
        <linearGradient id="art-aqua" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4fd1a2" />
          <stop offset="100%" stopColor="#14906a" />
        </linearGradient>
        <linearGradient id="art-slate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a4a" />
          <stop offset="100%" stopColor="#262632" />
        </linearGradient>
        <linearGradient id="art-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="art-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ff7a4f" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff7a4f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="art-glow-indigo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5b5bd6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#5b5bd6" stopOpacity="0" />
        </radialGradient>
        <filter id="art-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>
      <Scene />
    </svg>
  )
}

/** Loan: a banknote, a coin stack and a payoff ring nearly closed. */
function LoanScene() {
  return (
    <>
      <ellipse cx="150" cy="118" rx="120" ry="90" fill="url(#art-glow-indigo)" />
      <g filter="url(#art-shadow)" transform="rotate(-12 120 110)">
        <rect x="40" y="70" width="160" height="90" rx="14" fill="url(#art-indigo)" />
        <rect x="40" y="70" width="160" height="90" rx="14" fill="url(#art-gloss)" />
        <circle cx="120" cy="115" r="24" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" />
        <text x="120" y="126" textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff" fillOpacity="0.9" fontFamily="Inter, system-ui, sans-serif">$</text>
        <rect x="54" y="84" width="22" height="6" rx="3" fill="#fff" fillOpacity="0.5" />
        <rect x="164" y="140" width="22" height="6" rx="3" fill="#fff" fillOpacity="0.5" />
      </g>
      <g filter="url(#art-shadow)">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <ellipse cx="222" cy={168 - i * 13} rx="34" ry="11" fill="#b8452a" />
            <ellipse cx="222" cy={163 - i * 13} rx="34" ry="11" fill="url(#art-coral)" />
          </g>
        ))}
        <ellipse cx="222" cy="124" rx="22" ry="6" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
      </g>
      <circle cx="236" cy="52" r="26" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="6" />
      <circle cx="236" cy="52" r="26" stroke="url(#art-aqua)" strokeWidth="6" strokeLinecap="round" strokeDasharray="140 164" transform="rotate(-90 236 52)" />
      <path d="M226 52l7 7 13-14" stroke="#4fd1a2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Mortgage: a house with a lit window and a stacked payment breakdown beside it. */
function MortgageScene() {
  return (
    <>
      <ellipse cx="140" cy="130" rx="125" ry="85" fill="url(#art-glow)" />
      <g filter="url(#art-shadow)">
        <path d="M70 112l70-58 70 58v74a10 10 0 0 1-10 10H80a10 10 0 0 1-10-10z" fill="url(#art-slate)" />
        <path d="M58 116l82-70 82 70" stroke="url(#art-coral)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="98" y="122" width="34" height="30" rx="5" fill="#ffd5a8" />
        <rect x="98" y="122" width="34" height="30" rx="5" fill="url(#art-gloss)" />
        <path d="M115 122v30M98 137h34" stroke="#3a3a4a" strokeWidth="3" />
        <rect x="150" y="140" width="34" height="56" rx="5" fill="url(#art-indigo)" />
        <circle cx="176" cy="170" r="3" fill="#fff" fillOpacity="0.8" />
      </g>
      <g filter="url(#art-shadow)">
        <rect x="232" y="76" width="34" height="120" rx="9" fill="#262632" />
        <rect x="232" y="96" width="34" height="100" rx="9" fill="url(#art-blue)" />
        <rect x="232" y="78" width="34" height="16" rx="6" fill="url(#art-coral)" />
        <rect x="232" y="78" width="34" height="118" rx="9" fill="url(#art-gloss)" />
      </g>
    </>
  )
}

/** Car loan: a car on a road with a tag showing the month equity turns positive. */
function CarScene() {
  return (
    <>
      <ellipse cx="150" cy="128" rx="130" ry="80" fill="url(#art-glow-indigo)" />
      <rect x="20" y="182" width="260" height="6" rx="3" fill="#ffffff" fillOpacity="0.06" />
      {[40, 100, 160, 220].map((x) => (
        <rect key={x} x={x} y="183.5" width="28" height="3" rx="1.5" fill="#ffffff" fillOpacity="0.18" />
      ))}
      <g filter="url(#art-shadow)">
        <path d="M44 156c0-12 8-20 20-22l30-6 24-28c6-7 14-10 23-10h46c10 0 18 4 24 11l22 27 26 6c12 3 19 11 19 23v12c0 6-5 11-11 11H55c-6 0-11-5-11-11z" fill="url(#art-blue)" />
        <path d="M44 156c0-12 8-20 20-22l30-6 24-28c6-7 14-10 23-10h46c10 0 18 4 24 11l22 27 26 6c12 3 19 11 19 23v12c0 6-5 11-11 11H55c-6 0-11-5-11-11z" fill="url(#art-gloss)" />
        <path d="M108 128l18-22c4-5 9-7 15-7h22v29zM172 128V99h12c7 0 12 3 16 8l17 21z" fill="#1f2a44" fillOpacity="0.85" />
        <circle cx="96" cy="178" r="20" fill="#16161e" />
        <circle cx="96" cy="178" r="9" fill="#5a5a6a" />
        <circle cx="216" cy="178" r="20" fill="#16161e" />
        <circle cx="216" cy="178" r="9" fill="#5a5a6a" />
        <rect x="250" y="146" width="16" height="7" rx="3" fill="#ffd5a8" />
      </g>
      <g filter="url(#art-shadow)" transform="rotate(8 230 58)">
        <path d="M196 40h58a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-58l-14-18z" fill="url(#art-coral)" />
        <circle cx="198" cy="58" r="4" fill="#16161e" />
        <rect x="210" y="51" width="40" height="5" rx="2.5" fill="#fff" fillOpacity="0.85" />
        <rect x="210" y="61" width="26" height="5" rx="2.5" fill="#fff" fillOpacity="0.55" />
      </g>
    </>
  )
}

/** Investment: bars rising along a glowing growth curve. */
function InvestmentScene() {
  const bars = [34, 48, 62, 84, 108, 140]
  return (
    <>
      <ellipse cx="160" cy="120" rx="130" ry="90" fill="url(#art-glow-indigo)" />
      <g filter="url(#art-shadow)">
        {bars.map((h, i) => (
          <g key={i}>
            <rect x={46 + i * 38} y={196 - h} width="26" height={h} rx="7" fill={i < 4 ? 'url(#art-indigo)' : 'url(#art-aqua)'} />
            <rect x={46 + i * 38} y={196 - h} width="26" height={h} rx="7" fill="url(#art-gloss)" />
          </g>
        ))}
      </g>
      <path d="M40 160C90 150 130 128 170 100S240 50 266 40" stroke="url(#art-coral)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="266" cy="40" r="16" fill="url(#art-glow)" />
      <circle cx="266" cy="40" r="7" fill="#ff7a4f" stroke="#fff" strokeOpacity="0.85" strokeWidth="3" />
    </>
  )
}

/** Savings: a jar filling with coins, one more on its way in. */
function SavingsScene() {
  return (
    <>
      <ellipse cx="150" cy="125" rx="125" ry="90" fill="url(#art-glow)" />
      <g filter="url(#art-shadow)">
        <rect x="96" y="58" width="108" height="20" rx="8" fill="url(#art-coral)" />
        <path d="M100 78h100v96c0 14-11 24-24 24h-52c-13 0-24-10-24-24z" fill="#ffffff" fillOpacity="0.08" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M102 134h96v40c0 13-10 22-22 22h-52c-12 0-22-9-22-22z" fill="url(#art-aqua)" fillOpacity="0.9" />
        {[[126, 170], [154, 176], [178, 166], [140, 150], [166, 146]].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 3} rx="13" ry="5" fill="#b8452a" />
            <ellipse cx={x} cy={y} rx="13" ry="5" fill="url(#art-coral)" />
          </g>
        ))}
        <path d="M108 84v80" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g filter="url(#art-shadow)">
        <circle cx="232" cy="46" r="20" fill="url(#art-coral)" />
        <circle cx="232" cy="46" r="13" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" />
      </g>
      <path d="M218 72l-12 18" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 6" />
    </>
  )
}

/** Debt payoff: balances stepping down to zero, the last one cleared. */
function DebtScene() {
  const steps = [150, 118, 88, 58, 30]
  return (
    <>
      <ellipse cx="150" cy="125" rx="130" ry="88" fill="url(#art-glow)" />
      <g filter="url(#art-shadow)">
        {steps.map((h, i) => (
          <g key={i}>
            <rect x={40 + i * 46} y={196 - h} width="34" height={h} rx="8" fill={i < 3 ? 'url(#art-coral)' : 'url(#art-indigo)'} fillOpacity={1 - i * 0.08} />
            <rect x={40 + i * 46} y={196 - h} width="34" height={h} rx="8" fill="url(#art-gloss)" />
          </g>
        ))}
      </g>
      <path d="M57 38c40 0 70 40 108 74s60 54 93 60" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="3" strokeDasharray="5 7" strokeLinecap="round" />
      <g filter="url(#art-shadow)">
        <circle cx="258" cy="70" r="22" fill="url(#art-aqua)" />
        <path d="M248 70l7 7 13-14" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  )
}

const SCENES: Record<CalculatorId, () => React.JSX.Element> = {
  loan: LoanScene,
  mortgage: MortgageScene,
  'car-loan': CarScene,
  investment: InvestmentScene,
  savings: SavingsScene,
  'debt-payoff': DebtScene,
}
