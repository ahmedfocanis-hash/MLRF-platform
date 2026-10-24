import React from 'react';

export function BrandLogo({
  className = 'w-8 h-8',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0f766e" stroke="#0f766e" />
      <path d="M9 12h6M12 9v6" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  );
}
