import { describe, expect, it } from "vitest";
import { z } from "@/lib/zod";

describe("@/lib/zod", () => {
  it("sai com o JIT desligado (a CSP do navegador barra new Function)", () => {
    expect(z.config().jitless).toBe(true);
  });
});
