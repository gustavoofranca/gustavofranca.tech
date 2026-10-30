import { Command as Cmdk } from "cmdk";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCommands,
  hireMeCommand,
  isHireMeQuery,
  scoreCommand,
  type Command,
} from "@/lib/commands";
import { t, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL } from "@/lib/site";
import { paletteInputClass } from "@/components/islands/paletteStyles";
import { toggleTheme } from "@/lib/theme";

type Props = {
  locale: Locale;
  pathname: string;
  projects: { slug: string; title: string }[];
  // O que foi digitado no campo provisório enquanto este chunk carregava.
  initialSearch: string;
  onClose: () => void;
};

const GROUPS = [
  { id: "nav", key: "navigate" },
  { id: "projects", key: "projects" },
  { id: "actions", key: "actions" },
] as const;

const itemClass =
  "flex min-h-11 cursor-pointer items-center rounded-(--radius-control) px-3 text-sm text-fg data-[selected=true]:bg-line";

const headingClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-faint";

// Corpo da paleta, carregado só na primeira abertura (cmdk + Radix pesam ~20 KB gzip
// e não podem entrar no orçamento de JS da home). Desmonta ao fechar, então a busca
// e a mensagem de status começam zeradas a cada abertura.
export function PaletteBody({
  locale,
  pathname,
  projects,
  initialSearch,
  onClose,
}: Props) {
  const dict = t(locale).palette;
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState("");

  const commands = useMemo(
    () => buildCommands(locale, pathname, projects),
    [locale, pathname, projects],
  );
  const visible = isHireMeQuery(search)
    ? [...commands, hireMeCommand(locale)]
    : commands;

  // O <dialog> abre antes de este corpo existir (chunk carregado sob demanda),
  // então o foco no campo precisa ser dado aqui.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // O cmdk chama o filtro com o `value` do item (o id do comando).
  function filter(id: string, query: string) {
    const command = visible.find((c) => c.id === id);
    return command ? scoreCommand(command, query) : 0;
  }

  function run({ run: action }: Command) {
    if (action.type === "navigate") {
      if (action.href === pathname) onClose();
      else window.location.assign(action.href);
    } else if (action.type === "theme") {
      toggleTheme();
      onClose();
    } else {
      navigator.clipboard.writeText(action.text).then(
        () => setStatus(dict.copied),
        () => setStatus(`${dict.copyFailed} ${CONTACT_EMAIL}`),
      );
    }
  }

  return (
    <Cmdk label={dict.label} loop filter={filter}>
      <Cmdk.Input
        ref={inputRef}
        value={search}
        onValueChange={setSearch}
        placeholder={dict.placeholder}
        className={paletteInputClass}
      />
      <Cmdk.List className="max-h-[min(24rem,50dvh)] overflow-y-auto p-2">
        <Cmdk.Empty className="px-3 py-6 text-center text-sm text-muted">
          {dict.empty}
        </Cmdk.Empty>
        {GROUPS.map((group) => {
          const items = visible.filter((c) => c.group === group.id);
          if (items.length === 0) return null;
          return (
            <Cmdk.Group
              key={group.id}
              heading={dict.groups[group.key]}
              className={headingClass}
            >
              {items.map((command) => (
                <Cmdk.Item
                  key={command.id}
                  value={command.id}
                  onSelect={() => run(command)}
                  className={itemClass}
                >
                  {command.label}
                </Cmdk.Item>
              ))}
            </Cmdk.Group>
          );
        })}
      </Cmdk.List>
      <p
        role="status"
        className="px-4 pb-3 font-mono text-xs text-accent-2 empty:sr-only"
      >
        {status}
      </p>
    </Cmdk>
  );
}
