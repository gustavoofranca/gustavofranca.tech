import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Locale } from "@/i18n/locales";

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      language: string;
      theme: "light" | "dark";
      size: "flexible";
    },
  ): string | null | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Renderização explícita: o widget nasce depois da hidratação, dentro de um <div> que o
// React não preenche, então não há divergência entre o HTML do servidor e o do navegador.
// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<TurnstileApi> | undefined;

function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("Turnstile carregou sem a API"));
    script.onerror = () => {
      // Deixa tentar de novo numa próxima montagem (bloqueador, rede instável).
      loading = undefined;
      reject(new Error("Turnstile não carregou"));
    };
    document.head.append(script);
  });
  return loading;
}

// O widget coloca o token num <input name="cf-turnstile-response"> dentro do contêiner,
// e o formulário lê esse campo junto com os outros.
export function useTurnstile(
  container: RefObject<HTMLDivElement | null>,
  siteKey: string,
  locale: Locale,
) {
  const widgetId = useRef<string | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile().then(
      (api) => {
        const element = container.current;
        if (cancelled || !element) return;
        const theme =
          document.documentElement.dataset["theme"] === "light"
            ? "light"
            : "dark";
        widgetId.current =
          api.render(element, {
            sitekey: siteKey,
            language: locale === "pt" ? "pt-br" : "en",
            theme,
            size: "flexible",
          }) ?? undefined;
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [container, siteKey, locale]);

  // Token é de uso único: depois de cada envio o widget gera outro.
  const reset = useCallback(() => {
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }, []);

  return { reset, failed };
}
