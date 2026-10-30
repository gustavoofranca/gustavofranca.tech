import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CV_FILE, CV_HREF, hasCv } from "@/lib/cv";

describe("hasCv", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cv-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("é falso quando o PDF não existe", () => {
    expect(hasCv(dir)).toBe(false);
  });

  it("é verdadeiro quando o PDF existe", () => {
    writeFileSync(join(dir, CV_FILE), "%PDF-1.4");
    expect(hasCv(dir)).toBe(true);
  });

  it("o link aponta para o arquivo na raiz do site", () => {
    expect(CV_HREF).toBe(`/${CV_FILE}`);
    expect(CV_FILE).toBe("cv-gustavo-franca.pdf");
  });
});
