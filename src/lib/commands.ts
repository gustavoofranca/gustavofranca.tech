import { t, type Locale } from "@/lib/i18n";
import { alternatePath, routePath } from "@/lib/routes";
import { CONTACT_EMAIL } from "@/lib/site";

export type CommandAction =
  | { type: "navigate"; href: string }
  | { type: "theme" }
  | { type: "copy"; text: string };

export type Command = {
  id: string;
  group: "nav" | "projects" | "actions";
  label: string;
  // Termos extras para a busca (ex.: "dark" acha "Alternar tema").
  keywords: string[];
  run: CommandAction;
};

type PaletteProject = { slug: string; title: string };

export function buildCommands(
  locale: Locale,
  pathname: string,
  projects: PaletteProject[],
): Command[] {
  const dict = t(locale);
  const other: Locale = locale === "pt" ? "en" : "pt";
  // Todo projeto existe nos dois idiomas (o build exige os pares), então os
  // slugs de hoje valem para o idioma de destino.
  const slugs = new Set(projects.map((project) => project.slug));

  const navigate = (
    id: string,
    label: string,
    href: string,
    keywords: string[] = [],
  ): Command => ({
    id,
    group: "nav",
    label,
    keywords,
    run: { type: "navigate", href },
  });

  return [
    navigate("nav-home", dict.nav.home, routePath("home", locale), ["home"]),
    navigate("nav-projects", dict.nav.projects, routePath("projects", locale), [
      "projects",
      "work",
    ]),
    navigate("nav-about", dict.nav.about, routePath("about", locale), [
      "about",
      "stack",
    ]),
    navigate("nav-contact", dict.nav.contact, routePath("contact", locale), [
      "contact",
      "email",
    ]),
    ...projects.map((project): Command => ({
      id: `project-${project.slug}`,
      group: "projects",
      label: project.title,
      keywords: [project.slug],
      run: {
        type: "navigate",
        href: routePath("project", locale, project.slug),
      },
    })),
    {
      id: "action-theme",
      group: "actions",
      label: dict.palette.actions.toggleTheme,
      keywords: ["theme", "tema", "dark", "light", "escuro", "claro"],
      run: { type: "theme" },
    },
    {
      id: "action-language",
      group: "actions",
      label: dict.palette.actions.switchLanguage,
      keywords: ["language", "idioma", "english", "português", "en", "pt"],
      run: {
        type: "navigate",
        href: alternatePath(pathname, other, slugs),
      },
    },
    {
      id: "action-copy-email",
      group: "actions",
      label: dict.palette.actions.copyEmail,
      keywords: ["email", "e-mail", "copy", "copiar", CONTACT_EMAIL],
      run: { type: "copy", text: CONTACT_EMAIL },
    },
  ];
}

// Easter egg do spec (§10): só aparece quando a busca é exatamente este comando.
export function isHireMeQuery(query: string): boolean {
  return query.trim().toLowerCase().replace(/\s+/g, " ") === "sudo hire-me";
}

export function hireMeCommand(locale: Locale): Command {
  return {
    id: "easter-hire-me",
    group: "actions",
    label: t(locale).palette.actions.hireMe,
    keywords: ["sudo hire-me"],
    run: { type: "navigate", href: routePath("contact", locale) },
  };
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Pontuação da busca, de 0 (não aparece) a 1. Substring em vez da busca difusa do
// cmdk: com ~10 comandos, letras soltas ("tema" achando "Contato" via "e-mail")
// só atrapalham. Rótulo vale mais que palavra-chave; começo vale mais que meio.
export function scoreCommand(command: Command, query: string): number {
  const q = normalize(query);
  if (!q) return 1;
  const label = normalize(command.label);
  if (label.startsWith(q)) return 1;
  if (label.split(" ").some((word) => word.startsWith(q))) return 0.9;
  if (label.includes(q)) return 0.7;
  if (command.keywords.some((keyword) => normalize(keyword).includes(q))) {
    return 0.5;
  }
  return 0;
}
