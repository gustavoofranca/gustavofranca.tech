import type { ClientDirective } from "astro";

// client:afterload — hidrata depois do evento load, quando o navegador ficar ocioso.
// O client:idle sozinho dispara assim que a thread fica livre, que num celular pode ser
// antes de a imagem do LCP e as fontes chegarem: o runtime do React (~65 KB gzip) da
// paleta ⌘K disputava banda com elas. A paleta só é usada por atalho ou clique, então
// pode esperar a página terminar de carregar.
// https://docs.astro.build/en/reference/integrations-reference/#addclientdirective-option
const afterLoad: ClientDirective = (load) => {
  const hydrate = async () => {
    const run = await load();
    await run();
  };
  const whenIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => void hydrate());
    } else {
      setTimeout(() => void hydrate(), 200);
    }
  };
  if (document.readyState === "complete") {
    whenIdle();
  } else {
    window.addEventListener("load", whenIdle, { once: true });
  }
};

export default afterLoad;
