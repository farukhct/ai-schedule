import React from 'react';

interface GovtEmblemProps {
  className?: string;
  size?: number;
}

export const GovtEmblem: React.FC<GovtEmblemProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Government Emblem of Bangladesh"
    >
      {/* Outer Golden/Yellow Circle */}
      <circle cx="50" cy="50" r="47" fill="#006A4E" stroke="#F42A41" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="44" fill="#006A4E" stroke="#FFD700" strokeWidth="1.5" />

      {/* Red Center Disc (Sun of Bangladesh) */}
      <circle cx="50" cy="50" r="28" fill="#F42A41" />

      {/* Water Lily (Shapla) in Yellow/Gold */}
      <path
        d="M50 30 C50 38 46 44 42 48 C47 47 50 49 50 54 C50 49 53 47 58 48 C54 44 50 38 50 30 Z"
        fill="#FFD700"
      />
      {/* Side Petals */}
      <path
        d="M50 45 C44 40 37 42 35 47 C40 48 44 49 46 53 Z"
        fill="#FFEB3B"
      />
      <path
        d="M50 45 C56 40 63 42 65 47 C60 48 56 49 54 53 Z"
        fill="#FFEB3B"
      />

      {/* Water Waves (3 Waves below the Lily) */}
      <path
        d="M32 58 Q41 55 50 58 Q59 61 68 58 Q59 56 50 56 Q41 56 32 58 Z"
        fill="#FFFFFF"
      />
      <path
        d="M30 62 Q40 59 50 62 Q60 65 70 62 Q60 60 50 60 Q40 60 30 62 Z"
        fill="#FFFFFF"
      />
      <path
        d="M34 66 Q42 63 50 66 Q58 69 66 66 Q58 64 50 64 Q42 64 34 66 Z"
        fill="#FFFFFF"
      />

      {/* Paddy / Rice Sheaves on Left & Right */}
      <path
        d="M20 54 Q20 30 38 20 Q32 32 25 46 Q22 52 20 54 Z"
        fill="#FFD700"
      />
      <path
        d="M80 54 Q80 30 62 20 Q68 32 75 46 Q78 52 80 54 Z"
        fill="#FFD700"
      />

      {/* Four Stars at the Top representing four founding principles */}
      {/* Left Pair */}
      <polygon points="40,14 41,17 44,17 41.5,19 42.5,22 40,20 37.5,22 38.5,19 36,17 39,17" fill="#FFD700" />
      <polygon points="45,13 46,16 49,16 46.5,18 47.5,21 45,19 42.5,21 43.5,18 41,16 44,16" fill="#FFD700" />
      {/* Right Pair */}
      <polygon points="55,13 56,16 59,16 56.5,18 57.5,21 55,19 52.5,21 53.5,18 51,16 54,16" fill="#FFD700" />
      <polygon points="60,14 61,17 64,17 61.5,19 62.5,22 60,20 57.5,22 58.5,19 56,17 59,17" fill="#FFD700" />

      {/* Three Connected Jute Leaves at Top Peak */}
      <path
        d="M50 10 C48 13 48 16 50 18 C52 16 52 13 50 10 Z"
        fill="#FFD700"
      />
      <path
        d="M48 14 C45 15 44 17 46 19 C48 18 49 16 48 14 Z"
        fill="#FFD700"
      />
      <path
        d="M52 14 C55 15 56 17 54 19 C52 18 51 16 52 14 Z"
        fill="#FFD700"
      />
    </svg>
  );
};
