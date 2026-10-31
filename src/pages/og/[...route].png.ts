import type { APIRoute, GetStaticPaths } from "astro";
import { LOCALES } from "@/i18n/locales";
import {
  getFeaturedProjects,
  getProjects,
  getStackNames,
  projectSlug,
} from "@/lib/content";
import { t } from "@/lib/i18n";
import { ogPathFor, renderOg, type OgInput } from "@/lib/og";

type Props = { card: OgInput };

// Uma imagem por página e por projeto, nos dois idiomas. Os textos vêm dos
// dicionários e do conteúdo: nada é escrito aqui. A 404 é noindex e não tem imagem.
export const getStaticPaths = (async () => {
  const entries = await Promise.all(
    LOCALES.map(async (locale) => {
      const dict = t(locale);
      const names = await getStackNames(locale);
      const page = (
        key: "projects" | "about" | "contact" | "privacy",
        title: string,
        subtitle: string,
      ) => ({
        path: ogPathFor(locale, key),
        card: { title, subtitle, tags: [] },
      });
      const featured = await getFeaturedProjects(locale);
      return [
        {
          path: ogPathFor(locale, "home"),
          card: {
            title: dict.meta.siteName,
            subtitle: dict.meta.jobTitle,
            tags: featured.map((p) => p.data.title),
          },
        },
        page("projects", dict.projects.title, dict.meta.projectsDescription),
        page("about", dict.about.title, dict.meta.aboutDescription),
        page("contact", dict.contact.title, dict.meta.contactDescription),
        page("privacy", dict.privacy.title, dict.meta.privacyDescription),
        ...(await getProjects(locale)).map((project) => ({
          path: ogPathFor(locale, "project", projectSlug(project.id)),
          card: {
            title: project.data.title,
            subtitle: project.data.summary,
            tags: project.data.stack.map((id) => names.get(id) ?? id),
          },
        })),
      ];
    }),
  );
  return entries.flat().map(({ path, card }) => ({
    // "/og/pt/sobre.png" → "pt/sobre": a extensão vem do nome do arquivo da rota.
    params: { route: path.slice("/og/".length, -".png".length) },
    props: { card } satisfies Props,
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(Buffer.from(await renderOg(props.card)), {
    headers: { "Content-Type": "image/png" },
  });
