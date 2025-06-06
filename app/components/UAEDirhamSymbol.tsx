interface UAEDirhamSymbolProps {
  className?: string;
  size?: number;
}

export default function UAEDirhamSymbol({ className = "", size = 16 }: UAEDirhamSymbolProps) {
  return (
    <svg 
      width={size} 
      height={size * 0.875} // Maintain aspect ratio from original (105/120)
      viewBox="0 0 120 105" 
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0.000000,105.000000) scale(0.100000,-0.100000)">
        <path d="M132 1003 c18 -41 21 -69 22 -183 l1 -135 -62 1 c-34 0 -69 7 -78 14
        -13 11 -15 9 -15 -10 0 -35 29 -86 56 -99 14 -6 43 -11 64 -11 l40 0 0 -50 0
        -50 -61 0 c-33 0 -70 5 -81 11 -20 11 -21 9 -15 -27 9 -57 54 -94 113 -94 l47
        0 -5 -138 c-3 -114 -8 -146 -25 -180 l-20 -42 239 0 c184 0 255 4 311 16 151
        34 261 115 322 237 19 38 35 78 35 88 0 17 8 19 71 19 39 0 80 -5 91 -11 20
        -11 21 -9 15 27 -9 55 -44 86 -106 92 l-51 5 0 49 0 50 63 -4 c34 -2 71 -8 81
        -13 18 -8 19 -5 13 30 -9 55 -41 85 -91 85 -69 0 -82 8 -96 53 -31 105 -113
        198 -223 252 -108 53 -192 65 -452 65 l-224 0 21 -47z m428 -14 c84 -13 138
        -38 183 -83 42 -42 82 -116 95 -174 l9 -40 -141 -7 c-77 -3 -197 -5 -266 -3
        l-125 3 -3 158 -3 157 93 0 c51 0 122 -5 158 -11z m300 -459 l0 -50 -275 0
        -275 0 0 50 0 50 275 0 275 0 0 -50z m-16 -187 c-13 -57 -63 -151 -99 -186
        -74 -72 -160 -97 -331 -97 l-104 0 0 155 0 155 270 0 270 0 -6 -27z"/>
      </g>
    </svg>
  );
} 