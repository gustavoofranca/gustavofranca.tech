import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/contact/rateLimit";

describe("createRateLimiter", () => {
  it("permite 5 por janela e bloqueia o 6º; volta a permitir depois da janela", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 5,
      windowMs: 3_600_000,
      now: () => now,
    });
    for (let i = 0; i < 5; i++) expect(limiter.hit("1.2.3.4")).toBe(true);
    expect(limiter.hit("1.2.3.4")).toBe(false);

    now = 3_599_999;
    expect(limiter.hit("1.2.3.4")).toBe(false);

    now = 3_600_000;
    expect(limiter.hit("1.2.3.4")).toBe(true);
  });

  it("conta cada chave separadamente", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => 0,
    });
    expect(limiter.hit("a")).toBe(true);
    expect(limiter.hit("a")).toBe(false);
    expect(limiter.hit("b")).toBe(true);
  });

  it("não cresce sem limite com muitas chaves", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => now,
      maxKeys: 3,
    });
    limiter.hit("a");
    limiter.hit("b");
    limiter.hit("c");
    now = 2000;
    // As três expiraram: a varredura libera espaço e "a" recomeça do zero.
    expect(limiter.hit("d")).toBe(true);
    expect(limiter.size()).toBe(1);
    expect(limiter.hit("a")).toBe(true);
  });
});
