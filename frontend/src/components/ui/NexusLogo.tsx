interface NexusLogoProps {
  size?: number
  className?: string
}

export function NexusLogo({ size = 24, className = '' }: NexusLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Nexus Pay Logo"
    >
      <defs>
        <linearGradient id="nexusGradPrimary" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="nexusGradLink" x1="8" y1="7" x2="24" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>

      {/* Left Node Pillar */}
      <rect x="5.5" y="5.5" width="5" height="21" rx="2.5" fill="url(#nexusGradPrimary)" />

      {/* Right Node Pillar */}
      <rect x="21.5" y="5.5" width="5" height="21" rx="2.5" fill="url(#nexusGradPrimary)" />

      {/* Diagonal Nexus Bridge */}
      <path
        d="M8 8L24 24"
        stroke="url(#nexusGradLink)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Interconnected Core Hub */}
      <circle cx="16" cy="16" r="3.8" fill="#090A0F" stroke="url(#nexusGradLink)" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="1.5" fill="#38BDF8" />
    </svg>
  )
}
