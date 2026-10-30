import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { PaletteErrorBoundary } from "@/components/islands/PaletteErrorBoundary";
import { paletteInputClass } from "@/components/islands/paletteStyles";
import type { Locale } from "@/i18n/locales";

type Props = {
  locale: Locale;
  pathname: string;
  projects: { slug: string; title: string }[];
  // Vêm do servidor: importar o dicionário aqui puxaria os dois idiomas para o JS da home.
  labels: {
    label: string;
    placeholder: string;
    loadError: string;
    retry: string;
  };
};

// O corpo (cmdk) vem em um chunk à parte: fora do JS inicial da home.
const loadBody = () =>
  import("./PaletteBody").then((module) => ({ default: module.PaletteBody }));

// Cada tentativa cria um componente lazy novo: o React guarda a promessa rejeitada
// do anterior e nunca tentaria de novo.
const newAttempt = (attempt: number) => ({
  attempt,
  Body: lazy(loadBody),
});

export function CommandPalette({ locale, pathname, projects, labels }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // A busca mora aqui para o que foi digitado antes de o corpo carregar não se perder.
  const [search, setSearch] = useState("");
  const [{ attempt, Body }, setAttempt] = useState(() => newAttempt(0));

  // ⌘K / Ctrl+K e o evento do botão do cabeçalho: ambos vêm de fora do React.
  useEffect(() => {
    function show() {
      // Pedido do botão do cabeçalho atendido (ou desnecessário): apaga a marca.
      delete document.documentElement.dataset.paletteRequested;
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      const active = document.activeElement;
      // Com o foco no <body> não há para onde voltar; o navegador cuida disso.
      triggerRef.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      dialog.showModal();
      // Síncrono: o campo provisório precisa existir e ter foco antes da próxima tecla.
      flushSync(() => {
        setSearch("");
        setOpen(true);
      });
      fallbackInputRef.current?.focus();
    }
    // Falha de rede aqui não importa: a abertura tenta de novo e mostra o erro com retry.
    const warmUp = () => void loadBody().catch(() => {});
    function onKeyDown(event: KeyboardEvent) {
      // Ctrl/⌘ costuma vir uns milissegundos antes do K: já começa a baixar o corpo.
      if (event.key === "Control" || event.key === "Meta") warmUp();
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }
      event.preventDefault();
      if (event.repeat) return;
      if (dialogRef.current?.open) dialogRef.current.close();
      else show();
    }
    // Quem aproxima o mouse ou o foco do botão do cabeçalho provavelmente vai clicar.
    const triggers = document.querySelectorAll("[data-open-palette]");
    for (const trigger of triggers) {
      trigger.addEventListener("pointerenter", warmUp, { once: true });
      trigger.addEventListener("focus", warmUp, { once: true });
    }
    // Depois da hidratação, fora do caminho crítico: o JS inicial não muda.
    // Safari ainda não tem requestIdleCallback: cai em um timer.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle
      ? window.requestIdleCallback(warmUp)
      : window.setTimeout(warmUp, 2000);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("gf:open-palette", show);
    // Clique no botão do cabeçalho antes de a ilha hidratar: o evento se perdeu, mas o
    // pedido ficou marcado. Em microtask para o flushSync do show() não rodar dentro
    // da fase de efeitos do React.
    if (document.documentElement.dataset.paletteRequested !== undefined) {
      queueMicrotask(show);
    }
    return () => {
      for (const trigger of triggers) {
        trigger.removeEventListener("pointerenter", warmUp);
        trigger.removeEventListener("focus", warmUp);
      }
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
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
      aria-label={labels.label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] rounded-(--radius-card) border border-line bg-surface p-0 text-fg shadow-(--shadow-terminal) backdrop:bg-bg/80"
    >
      {open && (
        <PaletteErrorBoundary
          key={attempt}
          message={labels.loadError}
          retryLabel={labels.retry}
          onRetry={() => setAttempt(newAttempt(attempt + 1))}
        >
          <Suspense
            fallback={
              <input
                ref={fallbackInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={labels.label}
                placeholder={labels.placeholder}
                autoComplete="off"
                className={paletteInputClass}
              />
            }
          >
            <Body
              locale={locale}
              pathname={pathname}
              projects={projects}
              initialSearch={search}
              onClose={() => dialogRef.current?.close()}
            />
          </Suspense>
        </PaletteErrorBoundary>
      )}
    </dialog>
  );
}
