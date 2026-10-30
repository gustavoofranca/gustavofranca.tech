import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOOK = fileURLToPath(
  new URL("../../.claude/hooks/guarda-git.mjs", import.meta.url),
);

function bloqueia(command: string): boolean {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ tool_input: { command } }),
    encoding: "utf8",
  });
  return r.status === 2;
}

describe("guarda-git: git add", () => {
  it.each([
    "git add .env",
    "git add ./.env.local",
    'git add ".env.production"',
    "git add src\\.env",
    "git add -f dist/x.js",
    "git add --force dist/x.js",
    "git add -uf dist/x.js",
    "git -C repo add .env",
    "cd app && git add .env",
    "git add README.md; git add .env",
  ])("bloqueia %s", (cmd) => {
    expect(bloqueia(cmd)).toBe(true);
  });

  it.each([
    "git add .env.example",
    "git add src/a.ts && git commit -F msg.txt",
    "git add -A",
    'git add README.md; echo ".env fica fora"',
    'git commit -m "docs: explica por que git add -f e .env são barrados"',
    "git add docs/env.md",
  ])("permite %s", (cmd) => {
    expect(bloqueia(cmd)).toBe(false);
  });
});

describe("guarda-git: demais regras seguem valendo", () => {
  it.each([
    'git commit -m "feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>"',
    "git push --force origin feat/x",
    "git push -f origin feat/x",
    "git push origin main",
    "git commit --no-verify -m x",
  ])("bloqueia %s", (cmd) => {
    expect(bloqueia(cmd)).toBe(true);
  });

  it.each([
    "git push --force-with-lease origin feat/x",
    "git push origin feat/main-hero",
  ])("permite %s", (cmd) => {
    expect(bloqueia(cmd)).toBe(false);
  });
});
