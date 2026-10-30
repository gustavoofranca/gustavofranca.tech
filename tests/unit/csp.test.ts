import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cspHash } from "@/lib/csp";

describe("cspHash", () => {
  it("devolve o hash no formato da CSP (sha256-<base64>)", async () => {
    // Vetor conhecido: SHA-256 da string vazia.
    expect(await cspHash("")).toBe(
      "sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    );
  });

  it("hasheia o texto exato, em UTF-8, sem aparar espaços", async () => {
    const code = '\n  document.title = "Olá";\n';
    const expected = createHash("sha256").update(code, "utf8").digest("base64");
    expect(await cspHash(code)).toBe(`sha256-${expected}`);
    expect(await cspHash(code.trim())).not.toBe(`sha256-${expected}`);
  });
});
