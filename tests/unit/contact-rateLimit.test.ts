import { describe, expect, it } from "vitest";
import { createRateLimiter, rateLimitKey } from "@/lib/contact/rateLimit";

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

  it("apaga a janela expirada de um IP no próximo hit de qualquer IP", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 5,
      windowMs: 1000,
      now: () => now,
    });
    limiter.hit("a");
    expect(limiter.has("a")).toBe(true);
    now = 1000;
    limiter.hit("b");
    expect(limiter.has("a")).toBe(false);
    expect(limiter.size()).toBe(1);
  });

  it("sweep() apaga as janelas expiradas mesmo sem tráfego novo", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 5,
      windowMs: 1000,
      now: () => now,
    });
    limiter.hit("a");
    now = 999;
    limiter.sweep();
    expect(limiter.has("a")).toBe(true);
    now = 1000;
    limiter.sweep();
    expect(limiter.size()).toBe(0);
  });
});

describe("rateLimitKey", () => {
  it("IPv4 fica como está", () => {
    expect(rateLimitKey("203.0.113.7")).toBe("203.0.113.7");
    expect(rateLimitKey("::ffff:203.0.113.7")).toBe("203.0.113.7");
  });

  it("IPv6 vira o prefixo /64: endereços da mesma rede dividem o limite", () => {
    const a = rateLimitKey("2001:db8:1:2:aaaa::1");
    expect(a).toBe(rateLimitKey("2001:0db8:0001:0002:ffff:1:2:3"));
    expect(a).toBe(rateLimitKey("2001:DB8:1:2::"));
    expect(a).not.toBe(rateLimitKey("2001:db8:1:3::1"));
    expect(rateLimitKey("::1")).toBe(rateLimitKey("0:0:0:0:0:0:0:2"));
    expect(rateLimitKey("fe80::1%eth0")).toBe(rateLimitKey("fe80::2"));
  });

  it("o que não parece IP segue como está", () => {
    expect(rateLimitKey("desconhecido")).toBe("desconhecido");
  });

  it("dois IPv6 da mesma /64 esgotam o mesmo limite", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 1000,
      now: () => 0,
    });
    expect(limiter.hit(rateLimitKey("2001:db8::1"))).toBe(true);
    expect(limiter.hit(rateLimitKey("2001:db8::2"))).toBe(false);
  });
});
