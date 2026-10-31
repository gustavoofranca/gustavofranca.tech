import type { APIRoute, GetStaticPaths } from "astro";
import { getIconSprite } from "@/lib/content";

// Sprite dos ícones da stack, gerado no build com o hash do conteúdo no nome
// (/icons/stack-<hash>.svg). O HTML só referencia os <symbol> daqui.
export const getStaticPaths = (async () => {
  const { file } = await getIconSprite();
  return [{ params: { file: file.replace(/\.svg$/, "") } }];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async () => {
  const { svg } = await getIconSprite();
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
};
