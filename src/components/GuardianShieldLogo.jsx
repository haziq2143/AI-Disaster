import React from 'react';

/**
 * GuardianShieldLogo — Official brand identity symbol for Evacu8.
 * Dual-wing protective haven with central guiding compass needle.
 */
export default function GuardianShieldLogo({ size = 24, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="256" height="256" rx="57.6" fill="#0D47A1" />
      <g transform="translate(22.14 15.53) scale(0.827)" fill="#FFFFFF">
        {/* Left Wing with extra clearance */}
        <path fill="#FFFFFF" d="M 92 40 L 40 70 C 32 144 64 204 96 232 L 96 172 C 76 150 68 116 70 86 L 92 70 Z" />
        {/* Right Wing with extra clearance */}
        <path fill="#FFFFFF" d="M 164 40 L 216 70 C 224 144 192 204 160 232 L 160 172 C 180 150 188 116 186 86 L 164 70 Z" />
        {/* Bold Center Diamond */}
        <polygon fill="#FFFFFF" points="128,56 152,116 128,176 104,116" />
      </g>
    </svg>
  );
}
