interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo = ({ className = '', showSubtitle = false, variant = 'dark' }: LogoProps) => {
  const textColor = variant === 'dark' ? '#141214' : '#F6F1EE';
  const goldColor = '#C9B18A';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* MP Monogram */}
      <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <text
          x="50"
          y="72"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="60"
          fontWeight="500"
          fill={goldColor}
          letterSpacing="-2"
        >
          MP
        </text>
      </svg>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span
          className="font-display text-lg md:text-xl font-medium tracking-wide"
          style={{ color: textColor }}
        >
          Dra. Mayara Paccola
        </span>
        {showSubtitle && (
          <span
            className="text-[10px] md:text-xs tracking-[0.15em] uppercase font-body"
            style={{ color: goldColor }}
          >
            Estética Avançada
          </span>
        )}
      </div>
    </div>
  );
};

export const LogoMonogram = ({ className = '', variant = 'dark' }: { className?: string; variant?: 'light' | 'dark' }) => {
  const goldColor = '#C9B18A';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="60"
        fontWeight="500"
        fill={goldColor}
        letterSpacing="-2"
      >
        MP
      </text>
    </svg>
  );
};