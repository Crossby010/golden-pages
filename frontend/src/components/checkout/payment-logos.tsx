interface LogoProps {
  className?: string;
}

export function GCashLogo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <img
      src="/logos/gcash.svg"
      alt="GCash"
      className={`object-contain ${className}`}
    />
  );
}

export function MayaLogo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <img
      src="/logos/maya.png"
      alt="Maya"
      className={`object-contain ${className}`}
    />
  );
}

export function QRPhLogo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <img
      src="/logos/qrph.svg"
      alt="QR Ph"
      className={`object-contain ${className}`}
    />
  );
}

export function VisaLogo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <img
      src="/logos/visa.png"
      alt="Visa"
      className={`object-contain ${className}`}
    />
  );
}

export function MastercardLogo({ className = 'w-8 h-8' }: LogoProps) {
  return (
    <img
      src="/logos/mastercard.svg"
      alt="Mastercard"
      className={`object-contain ${className}`}
    />
  );
}

// Combined card logos (Visa + Mastercard)
export function CardLogos({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <VisaLogo className="w-8 h-5" />
      <MastercardLogo className="w-8 h-5" />
    </div>
  );
}