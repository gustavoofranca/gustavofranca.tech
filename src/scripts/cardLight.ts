import { lightPosition } from "@/lib/cardLight";

// Luz que segue o cursor (I1). Um ouvinte só, delegado, e no máximo uma escrita por
// quadro. A posição vai em propriedades CSS pelo CSSOM (setProperty), que a CSP
// libera; style="" e cssText, não. Com toque ou movimento reduzido não liga: a luz
// fica parada no topo (o padrão no CSS).
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let pending: { card: HTMLElement; x: number; y: number } | undefined;

function paint() {
  if (!pending) return;
  const { card, x, y } = pending;
  pending = undefined;
  const light = lightPosition({ x, y }, card.getBoundingClientRect());
  card.style.setProperty("--light-x", `${light.x}px`);
  card.style.setProperty("--light-y", `${light.y}px`);
}

document.addEventListener(
  "pointermove",
  (event) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest<HTMLElement>("[data-card-light]");
    if (!card) return;
    if (!pending) requestAnimationFrame(paint);
    pending = { card, x: event.clientX, y: event.clientY };
  },
  { passive: true },
);
