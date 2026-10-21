const STAR = "M12 2.5l2.94 6.1 6.56.8-4.84 4.6 1.24 6.6L12 17.4l-5.9 3.2 1.24-6.6L2.5 9.4l6.56-.8z";

export function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d={STAR} />
    </svg>
  );
}

/** Read-only star rating; fractional values (an average) fill the last star partly. */
export default function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  const label = `${Number.isInteger(value) ? value : value.toFixed(1)} out of 5 stars`;
  return (
    <span role="img" aria-label={label} className="inline-flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={`relative ${size}`}>
            <StarIcon className={`absolute inset-0 ${size} text-foreground/15`} />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <StarIcon className={`${size} text-accent`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
