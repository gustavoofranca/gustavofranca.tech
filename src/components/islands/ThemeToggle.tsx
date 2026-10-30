import { toggleTheme } from "@/lib/theme";

type Props = { label: string };

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ThemeToggle({ label }: Props) {
  // Sem estado no React: o tema vive no atributo do <html> (definido antes da pintura)
  // e o ícone troca por CSS. Assim não há divergência entre servidor e navegador.
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-(--radius-control) border border-line text-muted transition-colors duration-(--duration-fast) hover:text-fg"
    >
      <svg {...iconProps} className="hidden [html[data-theme=dark]_&]:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      <svg {...iconProps} className="hidden [html[data-theme=light]_&]:block">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}
