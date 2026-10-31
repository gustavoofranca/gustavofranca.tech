import { describe, expect, it } from "vitest";
import stack from "@/content/stack.json";
import { missingTechIcons, resolveTechIcon } from "@/lib/techIcons";

describe("resolveTechIcon", () => {
  it("acha a marca no Simple Icons pelo slug", () => {
    const icon = resolveTechIcon("react");
    expect(icon?.kind).toBe("brand");
    expect(icon?.paths).toHaveLength(1);
    expect(icon?.paths[0]).toMatch(/^M/);
  });

  it("acha o ícone genérico local pelo prefixo lucide:", () => {
    const icon = resolveTechIcon("lucide:headset");
    expect(icon?.kind).toBe("generic");
    expect(icon?.paths.length).toBeGreaterThan(0);
  });

  it("devolve undefined para slug que não existe", () => {
    expect(resolveTechIcon("nao-existe")).toBeUndefined();
    expect(resolveTechIcon("lucide:nao-existe")).toBeUndefined();
  });
});

describe("missingTechIcons", () => {
  it("lista só os slugs que não existem, na ordem", () => {
    expect(
      missingTechIcons(["react", "nao-existe", "lucide:x", "lucide:headset"]),
    ).toEqual(["nao-existe", "lucide:x"]);
  });

  it("todo ícone de stack.json existe no Simple Icons ou no conjunto local", () => {
    const slugs = stack.areas.flatMap((area) =>
      area.items.flatMap((item) => ("icon" in item ? [item.icon] : [])),
    );
    expect(slugs.length).toBeGreaterThan(0);
    expect(missingTechIcons(slugs)).toEqual([]);
  });
});
