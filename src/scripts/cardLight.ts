import { lightPosition } from "@/lib/cardLight";

// Luz que segue o cursor (I1, src/styles/cardLight.css). Ouvintes delegados e no máximo
// uma escrita por quadro. A posição vai em propriedades CSS pelo CSSOM (setProperty),
// que a CSP libera; style="" e cssText, não. Só com mouse e sem movimento reduzido; no
// resto a luz fica parada no topo (o padrão no CSS).
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src
const CARD = "[data-card-light]";
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let pending: { card: HTMLElement; x: number; y: number } | undefined;

function cardOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(CARD) : null;
}

function paint() {
  if (!pending) return;
  const { card, x, y } = pending;
  pending = undefined;
  const light = lightPosition({ x, y }, card.getBoundingClientRect());
  card.style.setProperty("--light-x", `${light.x}px`);
  card.style.setProperty("--light-y", `${light.y}px`);
}

// Volta ao topo (o foco do teclado mostra a luz lá), mas só com o mouse fora do cartão.
function reset(card: HTMLElement | null) {
  if (!card || card.matches(":hover")) return;
  card.style.removeProperty("--light-x");
  card.style.removeProperty("--light-y");
}

document.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType !== "mouse") return;
    if (!finePointer.matches || reducedMotion.matches) return;
    const card = cardOf(event.target);
    if (!card) return;
    if (!pending) requestAnimationFrame(paint);
    pending = { card, x: event.clientX, y: event.clientY };
  },
  { passive: true },
);

// Depois que a luz termina de apagar: limpar já na saída faria a luz pular para o topo
// durante o esmaecimento.
document.addEventListener("transitionend", (event) => {
  if (event.propertyName === "opacity") reset(cardOf(event.target));
});

document.addEventListener("focusin", (event) => reset(cardOf(event.target)));
