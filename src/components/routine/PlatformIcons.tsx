interface IconProps {
  className?: string;
}

export function GoogleMeetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 176 138" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="url(#gm-a)" d="M 102.015,81.88 C 95.186,77.162 95.094,67.102 101.836,62.26 L 157,22.643 c 7.94,-5.701 19,-0.038 19,9.737 v 77.755 c 0,9.675 -10.861,15.359 -18.821,9.859 z" />
      <path fill="url(#gm-b)" d="M 0,44 C 0,19.7 19.7,0 44,0 h 64 c 11.046,0 20,8.954 20,20 v 98 c 0,11.046 -8.954,20 -20,20 H 20 C 8.9539999,138 0,129.046 0,118 Z" />
      <mask id="gm-e" width="129" height="138" x="8" y="27" maskUnits="userSpaceOnUse">
        <path fill="#ffffff" d="M 8,71 C 8,46.7 27.7,27 52,27 h 64 c 11.046,0 20,8.954 20,20 v 98 c 0,11.046 -8.954,20 -20,20 H 28 C 16.954,165 8,156.046 8,145 Z" />
      </mask>
      <g filter="url(#gm-c)" mask="url(#gm-e)" transform="translate(-8,-27)">
        <path fill="url(#gm-f)" d="M 73.906,99.198 183.906,36 v 124 z" />
      </g>
      <circle cx="30" cy="108" r="14" fill="#ffffff" />
      <defs>
        <linearGradient id="gm-a" x1="128.8" x2="227.2" y1="104.44" y2="104.44" gradientUnits="userSpaceOnUse" gradientTransform="translate(-8,-27)">
          <stop stopColor="#f6a100" />
          <stop offset="1" stopColor="#ffbe00" />
        </linearGradient>
        <linearGradient id="gm-f" x1="136.22" x2="78.5" y1="91.32" y2="91.190002" gradientUnits="userSpaceOnUse">
          <stop offset=".15" stopColor="#ffb5e8" />
          <stop offset="1" stopColor="#ffdbf5" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="gm-b" cx="0" cy="0" r="1" gradientTransform="matrix(-159.725,0,0,-135.852,152.325,69)" gradientUnits="userSpaceOnUse">
          <stop offset=".15" stopColor="#ffe921" />
          <stop offset="1" stopColor="#fec700" />
        </radialGradient>
        <filter id="gm-c" width="166" height="180" x="45.91" y="8" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" mode="normal" />
          <feGaussianBlur result="effect1_foregroundBlur_37584_9338" stdDeviation="14" />
        </filter>
      </defs>
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"
        fill="#FF0000"
      />
      <path d="M9.6 15.6V8.4l6.2 3.6-6.2 3.6z" fill="#fff" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z"
        fill="#1877F2"
      />
      <path d="M16.7 15.5 17.2 12h-3.3V9.8c0-1 .5-1.9 2-1.9h1.5V5c0 0-1.4-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.6V12h-3v3.5h3v8.4c.6.1 1.3.1 1.9.1s1.3 0 1.9-.1v-8.4h2.8z" fill="#fff" />
    </svg>
  );
}
