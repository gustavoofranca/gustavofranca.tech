import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { filterProjects } from "@/lib/filter";

type Item = { slug: string; data: { kind: string; stack: string[] } };

type Props = {
  items: Item[];
  kinds: { id: string; label: string }[];
  stacks: { id: string; name: string }[];
  labels: {
    group: string;
    all: string;
    kind: string;
    stack: string;
    shown: string;
    empty: string;
  };
};

// O servidor renderiza todos os cartões; esta ilha só esconde os que não passam no
// filtro. Sem JS, ou antes da hidratação, a lista inteira continua visível.
export function ProjectFilter({ items, kinds, stacks, labels }: Props) {
  const [kind, setKind] = useState("");
  const [stack, setStack] = useState("");
  const selectId = useId();

  const visible = filterProjects(items, { kind, stack });

  // Sincroniza com o DOM de fora da ilha (os cartões são HTML estático). A
  // limpeza devolve a lista inteira se a ilha for desmontada.
  useEffect(() => {
    const slugs = new Set(
      filterProjects(items, { kind, stack }).map((item) => item.slug),
    );
    const cards = document.querySelectorAll<HTMLElement>("[data-project-slug]");
    for (const card of cards) {
      card.hidden = !slugs.has(card.dataset["projectSlug"] ?? "");
    }
    return () => {
      for (const card of cards) card.hidden = false;
    };
  }, [items, kind, stack]);

  const status =
    visible.length === 0
      ? labels.empty
      : labels.shown
          .replace("{shown}", String(visible.length))
          .replace("{total}", String(items.length));

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label={labels.group}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div
          role="group"
          aria-label={labels.kind}
          className="flex flex-wrap gap-2"
        >
          {[{ id: "", label: labels.all }, ...kinds].map((option) => {
            const pressed = kind === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={pressed}
                onClick={() => setKind(option.id)}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full border px-4 font-mono text-sm transition-colors duration-(--duration-fast)",
                  pressed
                    ? "border-accent bg-surface text-fg"
                    : "border-line text-muted hover:text-fg",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="font-mono text-sm text-faint">
            {labels.stack}
          </label>
          <select
            id={selectId}
            value={stack}
            onChange={(event) => setStack(event.target.value)}
            className="min-h-10 rounded-(--radius-control) border border-line bg-surface px-3 text-sm text-fg"
          >
            <option value="">{labels.all}</option>
            {stacks.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p role="status" className="font-mono text-sm text-faint">
        {status}
      </p>
    </div>
  );
}
