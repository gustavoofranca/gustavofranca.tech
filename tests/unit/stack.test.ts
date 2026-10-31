import { describe, expect, it } from "vitest";
import { STACK_LEVELS, stackName } from "@/lib/stack";

describe("stackName", () => {
  it("nome simples vale para os dois idiomas", () => {
    expect(stackName("React", "pt")).toBe("React");
    expect(stackName("React", "en")).toBe("React");
  });

  it("nome bilíngue sai no idioma da página", () => {
    const name = { pt: "Git e GitHub", en: "Git and GitHub" };
    expect(stackName(name, "pt")).toBe("Git e GitHub");
    expect(stackName(name, "en")).toBe("Git and GitHub");
  });
});

describe("STACK_LEVELS", () => {
  it("vai do básico ao avançado, na ordem da legenda", () => {
    expect(STACK_LEVELS).toEqual(["basic", "intermediate", "advanced"]);
  });
});
