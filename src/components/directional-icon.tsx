// Frecce e chevron orizzontali: tutte passano da qui (US-016).
// Il disegno punta verso la fine della riga ("forward" = destra in it/en); con dir="rtl"
// (arabo, Fase 2) la classe `rtl:-scale-x-100` lo specchia, quindi punta a sinistra.
// Le icone sono decorative: il testo o l'aria-label va sul pulsante o sul link che le contiene.

type DirectionalIconProps = {
  shape: "arrow" | "chevron";
  /** "forward": avanti / successivo; "back": indietro / precedente. */
  direction: "forward" | "back";
  /** Dimensione e colore (es. `size-4`); predefinito 1em e il colore del testo. */
  className?: string;
};

const PATHS = {
  arrow: { forward: "M5 12h14M13 6l6 6-6 6", back: "M19 12H5M11 6l-6 6 6 6" },
  chevron: { forward: "M9 6l6 6-6 6", back: "M15 6l-6 6 6 6" },
} as const;

export function DirectionalIcon({
  shape,
  direction,
  className,
}: DirectionalIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={
        className
          ? `shrink-0 rtl:-scale-x-100 ${className}`
          : "shrink-0 rtl:-scale-x-100"
      }
    >
      <path d={PATHS[shape][direction]} />
    </svg>
  );
}
