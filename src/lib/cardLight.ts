export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max);
}

// Posição da luz do cartão (I1) em pixels, relativa ao canto do cartão. Presa ao cartão:
// o ponteiro em cima da borda daria -0,5 px e a luz sairia do lugar. Inteiro, porque
// fração de pixel não muda nada no gradiente e só gera mais escrita de estilo.
export function lightPosition(pointer: Point, box: Box): Point {
  return {
    x: Math.round(clamp(pointer.x - box.left, box.width)),
    y: Math.round(clamp(pointer.y - box.top, box.height)),
  };
}
