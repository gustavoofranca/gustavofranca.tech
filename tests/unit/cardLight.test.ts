import { describe, expect, it } from "vitest";
import { lightPosition } from "@/lib/cardLight";

const rect = { left: 100, top: 200, width: 300, height: 400 };

describe("lightPosition", () => {
  it("devolve a posição do ponteiro relativa ao cartão", () => {
    expect(lightPosition({ x: 250, y: 260 }, rect)).toEqual({ x: 150, y: 60 });
  });

  it("arredonda para pixel inteiro", () => {
    expect(lightPosition({ x: 100.4, y: 200.6 }, rect)).toEqual({
      x: 0,
      y: 1,
    });
  });

  it("prende a luz dentro do cartão quando o ponteiro está na borda", () => {
    expect(lightPosition({ x: 99, y: 199 }, rect)).toEqual({ x: 0, y: 0 });
    expect(lightPosition({ x: 401, y: 601 }, rect)).toEqual({
      x: 300,
      y: 400,
    });
  });
});
