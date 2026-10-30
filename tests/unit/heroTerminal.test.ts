import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/i18n/locales";
import { t } from "@/lib/i18n";

// Os números ficam num arquivo estático porque o hash da CSP é calculado no build a
// partir dele (astro.config.mjs). Se um comando do terminal mudar, este teste avisa.
const css = readFileSync("src/styles/inline/heroTerminal.css", "utf8");

function customProperty(name: string): number {
  const match = new RegExp(`${name}:\\s*(\\d+)`).exec(css);
  return Number(match?.[1]);
}

describe("heroTerminal.css", () => {
  for (const locale of LOCALES) {
    it(`--n1 e --n2 são o tamanho dos comandos em ${locale}`, () => {
      const { terminal } = t(locale);
      expect(customProperty("--n1")).toBe(terminal.firstCommand.length);
      expect(customProperty("--n2")).toBe(terminal.secondCommand.length);
    });
  }
});
