import { describe, expect, it } from "vitest";
import {
  buildIconSprite,
  iconSpriteFile,
  iconSymbolId,
} from "@/lib/iconSprite";

describe("iconSymbolId", () => {
  it("marca ganha prefixo si- e genérico troca os dois-pontos", () => {
    expect(iconSymbolId("react")).toBe("si-react");
    expect(iconSymbolId("lucide:headset")).toBe("lucide-headset");
  });
});

describe("buildIconSprite", () => {
  it("gera um <symbol> por ícone, sem repetir, em ordem estável", () => {
    const a = buildIconSprite(["react", "git", "react"]);
    const b = buildIconSprite(["git", "react"]);
    expect(a).toBe(b);
    expect(a.match(/<symbol /g)).toHaveLength(2);
    expect(a).toContain('<symbol id="si-git" viewBox="0 0 24 24"');
    expect(a).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg">/);
  });

  it("marca é preenchida e genérico é contorno, os dois na cor do texto", () => {
    const sprite = buildIconSprite(["react", "lucide:headset"]);
    expect(sprite).toMatch(/<symbol id="si-react"[^>]*fill="currentColor"/);
    expect(sprite).toMatch(
      /<symbol id="lucide-headset"[^>]*fill="none"[^>]*stroke="currentColor"/,
    );
  });

  it("lança citando os slugs que não existem", () => {
    expect(() => buildIconSprite(["react", "nao-existe", "lucide:x"])).toThrow(
      /nao-existe, lucide:x/,
    );
  });
});

describe("iconSpriteFile", () => {
  it("o nome leva o hash do conteúdo: muda quando o sprite muda", () => {
    const one = iconSpriteFile(buildIconSprite(["react"]));
    const same = iconSpriteFile(buildIconSprite(["react"]));
    const other = iconSpriteFile(buildIconSprite(["react", "git"]));
    expect(one).toMatch(/^stack-[0-9a-f]{10}\.svg$/);
    expect(same).toBe(one);
    expect(other).not.toBe(one);
  });
});
