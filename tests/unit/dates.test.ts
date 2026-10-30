import { describe, expect, it } from "vitest";
import { isFutureMonth } from "@/lib/dates";

describe("isFutureMonth", () => {
  it("é verdadeiro quando o mês de término vem depois de hoje", () => {
    expect(isFutureMonth("2027-12", "2026-10")).toBe(true);
    expect(isFutureMonth("2026-11", "2026-10")).toBe(true);
  });

  it("o mês corrente já não é previsão", () => {
    expect(isFutureMonth("2026-10", "2026-10")).toBe(false);
  });

  it("é falso para mês passado", () => {
    expect(isFutureMonth("2023-06", "2026-10")).toBe(false);
  });

  it("é falso quando não há término (ainda em andamento)", () => {
    expect(isFutureMonth(null, "2026-10")).toBe(false);
  });
});
