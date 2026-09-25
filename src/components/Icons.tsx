import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function svg(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...props,
  }
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M5 13.5 9.5 18 19 7" />
    </svg>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="M16 3.5A8.5 8.5 0 1 0 20.5 14 7 7 0 0 1 16 3.5Z" />
    </svg>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2 4.8 4.8M19.2 19.2 17.8 17.8M6.2 17.8 4.8 19.2M19.2 4.8 17.8 6.2" />
    </svg>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...svg(props)} width={28} height={28}>
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <rect x="8" y="8" width="11" height="13" rx="2" />
      <path d="M5 16V5a2 2 0 0 1 2-2h9" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}
