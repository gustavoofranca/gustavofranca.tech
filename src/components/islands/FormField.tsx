import { cn } from "@/lib/cn";

type Props = {
  id: string;
  name: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  multiline?: boolean;
  type?: "text" | "email";
  autoComplete: string;
  minLength?: number;
  maxLength: number;
};

const controlClass =
  "w-full rounded-(--radius-control) border border-faint bg-surface px-3 py-2 text-base text-fg transition-colors duration-(--duration-fast) placeholder:text-faint hover:border-muted aria-invalid:border-accent";

// Erro e dica ficam ligados ao campo por aria-describedby (WCAG 3.3.1 e qualidade.md).
export function FormField({
  id,
  name,
  label,
  error,
  hint,
  multiline = false,
  type = "text",
  autoComplete,
  minLength,
  maxLength,
}: Props) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  const shared = {
    id,
    name,
    required: true,
    autoComplete,
    maxLength,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: cn(controlClass, multiline && "min-h-40 resize-y"),
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      {multiline ? (
        <textarea {...shared} minLength={minLength} rows={6} />
      ) : (
        <input {...shared} type={type} minLength={minLength} />
      )}
      {hint && (
        <p id={hintId} className="text-sm text-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
