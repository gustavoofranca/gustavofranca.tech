import { describe, expect, it } from "vitest";
import {
  codePointsInHtml,
  codePointsInText,
  formatCodePoint,
  missingCodePoints,
} from "@/lib/fontCoverage";

const cp = (char: string) => char.codePointAt(0);

describe("codePointsInHtml", () => {
  it("pega o texto já com as entidades decodificadas", () => {
    const used = codePointsInHtml(
      "<!doctype html><html><body><p>Ação &mdash; &#x2318;K</p></body></html>",
    );
    for (const char of ["A", "ç", "ã", "o", "—", "⌘", "K"]) {
      expect(used.has(cp(char) ?? -1)).toBe(true);
    }
    expect(used.has(cp("&") ?? -1)).toBe(false);
  });

  it("pega valores de atributo (placeholder, props das ilhas)", () => {
    const used = codePointsInHtml(
      '<input placeholder="Buscar…"><astro-island props="{&quot;t&quot;:&quot;Olá&quot;}"></astro-island>',
    );
    expect(used.has(cp("…") ?? -1)).toBe(true);
    expect(used.has(cp("á") ?? -1)).toBe(true);
  });

  it("pega o conteúdo de <template> e de <script>", () => {
    const used = codePointsInHtml(
      '<template><span>✓</span></template><script type="application/ld+json">{"name":"França"}</script>',
    );
    expect(used.has(cp("✓") ?? -1)).toBe(true);
    expect(used.has(cp("ç") ?? -1)).toBe(true);
  });
});

describe("codePointsInText", () => {
  it("conta pares substitutos como um caractere só", () => {
    expect([...codePointsInText("a😀")]).toEqual([0x61, 0x1f600]);
  });
});

describe("missingCodePoints", () => {
  const covered = new Set([0x20, 0x61, 0x62]);

  it("devolve o que falta, ordenado e sem repetir", () => {
    expect(missingCodePoints([0x2318, 0x61, 0x2014, 0x2318], covered)).toEqual([
      0x2014, 0x2318,
    ]);
  });

  it("ignora caracteres de controle, que não têm glifo", () => {
    expect(missingCodePoints([0x09, 0x0a, 0x0d, 0x85, 0x61], covered)).toEqual(
      [],
    );
  });

  it("ignora o que foi aceito como fonte do sistema", () => {
    expect(
      missingCodePoints([0x2318, 0x2014], covered, new Set([0x2318])),
    ).toEqual([0x2014]);
  });
});

describe("formatCodePoint", () => {
  it("mostra o código e o caractere", () => {
    expect(formatCodePoint(0x2318)).toBe("U+2318 (⌘)");
    expect(formatCodePoint(0x1f600)).toBe("U+1F600 (😀)");
  });
});
