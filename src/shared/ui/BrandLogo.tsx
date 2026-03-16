import clsx from 'clsx';
import brandMark from '@/shared/assets/brand/dunamis-farm-agro-mark.png';
import brandWordmark from '@/shared/assets/brand/dunamis-farm-agro-wordmark.png';

interface BrandLogoProps {
  variant?: 'mini' | 'inline' | 'hero';
  className?: string;
}

export const BrandLogo = ({ variant = 'inline', className }: BrandLogoProps) => {
  const src = variant === 'mini' ? brandMark : brandWordmark;

  return (
    <div className={clsx('brand-logo', `brand-logo-${variant}`, className)}>
      <img className="brand-logo-image" src={src} alt="Dunamis Farm Agro" />
    </div>
  );
};
