import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/locales";

type Props = {
  locale: Locale;
  // Vem do servidor: importar o dicionário aqui puxaria os dois idiomas para o JS da home.
  label: string;
  pathname: string;
  projects: { slug: string; title: string }[];
};

// O corpo (cmdk) vem em um chunk à parte: a home só baixa isso ao abrir a paleta.
const loadBody = () =>
  import("./PaletteBody").then((module) => ({ default: module.PaletteBody }));
const PaletteBody = lazy(loadBody);

export function CommandPalette({ locale, label, pathname, projects }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K e o evento do botão do cabeçalho: ambos vêm de fora do React.
  useEffect(() => {
    function show() {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setOpen(true);
      dialog.showModal();
    }
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl/⌘ costuma vir uns milissegundos antes do K: já começa a baixar o corpo.
      if (event.key === "Control" || event.key === "Meta") void loadBody();
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      event.preventDefault();
      if (dialogRef.current?.open) dialogRef.current.close();
      else show();
    }
    // Quem aproxima o mouse ou o foco do botão do cabeçalho provavelmente vai clicar.
    const triggers = document.querySelectorAll("[data-open-palette]");
    const warmUp = () => void loadBody();
    for (const trigger of triggers) {
      trigger.addEventListener("pointerenter", warmUp, { once: true });
      trigger.addEventListener("focus", warmUp, { once: true });
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("gf:open-palette", show);
    return () => {
      for (const trigger of triggers) {
        trigger.removeEventListener("pointerenter", warmUp);
        trigger.removeEventListener("focus", warmUp);
      }
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("gf:open-palette", show);
    };
  }, []);

  function onClose() {
    setOpen(false);
    // O navegador já devolve o foco, mas não em todos os casos (ex.: gatilho removido).
    triggerRef.current?.focus();
  }

  return (
    // O clique no fundo (::backdrop) chega ao próprio <dialog>; o teclado já fecha com Esc.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] rounded-(--radius-card) border border-line bg-surface p-0 text-fg shadow-(--shadow-terminal) backdrop:bg-bg/80"
    >
      {open && (
        <Suspense fallback={null}>
          <PaletteBody
            locale={locale}
            pathname={pathname}
            projects={projects}
            onClose={() => dialogRef.current?.close()}
          />
        </Suspense>
      )}
    </dialog>
  );
}
