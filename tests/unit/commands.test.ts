import { describe, expect, it } from "vitest";
import {
  buildCommands,
  hireMeCommand,
  isHireMeQuery,
  scoreCommand,
  type Command,
} from "@/lib/commands";

const projects = [{ slug: "lumina", title: "Lumina" }];
const hrefs = (commands: Command[]) =>
  commands.flatMap((c) => (c.run.type === "navigate" ? [c.run.href] : []));

describe("buildCommands", () => {
  const pt = buildCommands("pt", "/", projects);

  it("navega para projetos, sobre e contato", () => {
    expect(hrefs(pt)).toEqual(
      expect.arrayContaining(["/projetos", "/sobre", "/contato"]),
    );
  });

  it("lista cada projeto com o endereço do estudo de caso", () => {
    const lumina = pt.find((c) => c.group === "projects");
    expect(lumina?.label).toBe("Lumina");
    expect(lumina?.run).toEqual({ type: "navigate", href: "/projetos/lumina" });
  });

  it("tem as ações de tema, idioma e copiar e-mail", () => {
    const actions = pt.filter((c) => c.group === "actions");
    expect(actions.map((c) => c.run)).toEqual(
      expect.arrayContaining([
        { type: "theme" },
        { type: "navigate", href: "/en/" },
        { type: "copy", text: "contato@gustavofranca.tech" },
      ]),
    );
  });

  it("troca de idioma mantendo a página", () => {
    const onProject = buildCommands("pt", "/projetos/lumina", projects);
    expect(hrefs(onProject)).toContain("/en/projects/lumina");
    const onEnglish = buildCommands("en", "/en/about", projects);
    expect(hrefs(onEnglish)).toContain("/sobre");
  });

  it("usa os textos do idioma e caminhos do idioma", () => {
    const en = buildCommands("en", "/en/", projects);
    expect(en.find((c) => c.run.type === "theme")?.label).toBe("Toggle theme");
    expect(hrefs(en)).toEqual(
      expect.arrayContaining(["/en/projects", "/en/about", "/en/contact"]),
    );
  });

  it("não repete ids", () => {
    const ids = pt.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("easter egg", () => {
  it("reconhece sudo hire-me sem ligar para caixa e espaços", () => {
    expect(isHireMeQuery("sudo hire-me")).toBe(true);
    expect(isHireMeQuery("  SUDO   hire-me ")).toBe(true);
    expect(isHireMeQuery("sudo")).toBe(false);
  });

  it("leva para o contato do idioma", () => {
    expect(hireMeCommand("pt").run).toEqual({
      type: "navigate",
      href: "/contato",
    });
    expect(hireMeCommand("en").run).toEqual({
      type: "navigate",
      href: "/en/contact",
    });
  });
});

describe("scoreCommand", () => {
  const commands = buildCommands("pt", "/", [
    { slug: "checkpoint", title: "Checkpoint" },
  ]);
  const find = (id: string) => {
    const command = commands.find((c) => c.id === id);
    if (!command) throw new Error(`comando ${id} não existe`);
    return command;
  };

  it("sem busca, tudo aparece", () => {
    expect(scoreCommand(find("nav-about"), "")).toBeGreaterThan(0);
  });

  it("ignora caixa e acentos", () => {
    expect(scoreCommand(find("nav-home"), "INICIO")).toBeGreaterThan(0);
  });

  it("não acha por letras soltas (sem busca difusa)", () => {
    expect(scoreCommand(find("nav-contact"), "tema")).toBe(0);
  });

  it("começo do rótulo vale mais que meio do rótulo, que vale mais que palavra-chave", () => {
    const theme = find("action-theme");
    const start = scoreCommand(theme, "altern");
    const word = scoreCommand(theme, "tema");
    const middle = scoreCommand(theme, "nar");
    const keyword = scoreCommand(theme, "dark");
    expect(start).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(keyword);
    expect(keyword).toBeGreaterThan(0);
  });

  it("acha o projeto pelo nome", () => {
    expect(scoreCommand(find("project-checkpoint"), "check")).toBeGreaterThan(
      0,
    );
  });
});
