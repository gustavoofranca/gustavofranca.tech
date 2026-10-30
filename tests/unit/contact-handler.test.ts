import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeResult,
  handleContact,
  logContactResult,
  type ContactDeps,
} from "@/lib/contact/handler";
import { createRateLimiter } from "@/lib/contact/rateLimit";

const NOW = 1_700_000_100_000;

const valid = {
  name: "João Ávila",
  email: "joao+portfolio@exemplo.com",
  message: "<script>alert(1)</script> olá, tudo bem?",
  locale: "pt",
  website: "",
  startedAt: NOW - 10_000,
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
};

function makeDeps(overrides: Partial<ContactDeps> = {}) {
  const send = vi.fn<ContactDeps["send"]>(async () => undefined);
  const verifyCaptcha = vi.fn<ContactDeps["verifyCaptcha"]>(async () => true);
  const deps: ContactDeps = {
    limiter: createRateLimiter({
      limit: 5,
      windowMs: 3_600_000,
      now: () => NOW,
    }),
    verifyCaptcha,
    send,
    ...overrides,
  };
  return { deps, send, verifyCaptcha };
}

const ctx = (deps: ContactDeps) => ({ ip: "203.0.113.7", now: NOW, deps });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleContact", () => {
  it("envia uma mensagem válida (e-mail com +, nome com acento)", async () => {
    const { deps, send } = makeDeps();
    await expect(handleContact(valid, ctx(deps))).resolves.toEqual({
      ok: true,
    });
    expect(send).toHaveBeenCalledTimes(1);
    const email = send.mock.calls[0]?.[0];
    expect(email?.replyTo).toBe("joao+portfolio@exemplo.com");
    expect(email?.text).toContain("<script>alert(1)</script> olá, tudo bem?");
    expect(email).not.toHaveProperty("html");
  });

  it("rejeita \\r\\n no nome apontando o campo", async () => {
    const { deps, send } = makeDeps();
    await expect(
      handleContact({ ...valid, name: "Ana\r\nBcc: x@y.z" }, ctx(deps)),
    ).resolves.toEqual({ ok: false, reason: "invalid", fields: ["name"] });
    expect(send).not.toHaveBeenCalled();
  });

  it("honeypot preenchido é spam e não chama nada", async () => {
    const { deps, send, verifyCaptcha } = makeDeps();
    await expect(
      handleContact({ ...valid, website: "spam" }, ctx(deps)),
    ).resolves.toEqual({ ok: false, reason: "spam" });
    expect(send).not.toHaveBeenCalled();
    expect(verifyCaptcha).not.toHaveBeenCalled();
  });

  it("preenchido em menos de 3 s é spam", async () => {
    const { deps, send } = makeDeps();
    await expect(
      handleContact({ ...valid, startedAt: NOW - 1000 }, ctx(deps)),
    ).resolves.toEqual({ ok: false, reason: "spam" });
    expect(send).not.toHaveBeenCalled();
  });

  it("3000 ms exatos passam", async () => {
    const { deps } = makeDeps();
    await expect(
      handleContact({ ...valid, startedAt: NOW - 3000 }, ctx(deps)),
    ).resolves.toEqual({ ok: true });
  });

  it("startedAt ausente (sem JS) não bloqueia por tempo", async () => {
    const { deps, send } = makeDeps();
    const withoutTime: Record<string, unknown> = { ...valid };
    delete withoutTime["startedAt"];
    await expect(handleContact(withoutTime, ctx(deps))).resolves.toEqual({
      ok: true,
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("startedAt no futuro (relógio do visitante adiantado) não bloqueia", async () => {
    const { deps } = makeDeps();
    await expect(
      handleContact({ ...valid, startedAt: NOW + 60_000 }, ctx(deps)),
    ).resolves.toEqual({ ok: true });
  });

  it("o 6º envio na mesma hora é bloqueado pelo limite", async () => {
    const { deps, send } = makeDeps();
    for (let i = 0; i < 5; i++) {
      await expect(handleContact(valid, ctx(deps))).resolves.toEqual({
        ok: true,
      });
    }
    await expect(handleContact(valid, ctx(deps))).resolves.toEqual({
      ok: false,
      reason: "rate_limited",
    });
    expect(send).toHaveBeenCalledTimes(5);
  });

  it("IPv6 da mesma /64 dividem o limite", async () => {
    const { deps } = makeDeps();
    for (let i = 1; i <= 5; i++) {
      await expect(
        handleContact(valid, { ip: `2001:db8::${i}`, now: NOW, deps }),
      ).resolves.toEqual({ ok: true });
    }
    await expect(
      handleContact(valid, { ip: "2001:db8::ffff", now: NOW, deps }),
    ).resolves.toEqual({ ok: false, reason: "rate_limited" });
  });

  it("captcha recusado não envia", async () => {
    const { deps, send } = makeDeps({ verifyCaptcha: async () => false });
    await expect(handleContact(valid, ctx(deps))).resolves.toEqual({
      ok: false,
      reason: "captcha",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("captcha indisponível (rede) falha fechado", async () => {
    const { deps, send } = makeDeps({
      verifyCaptcha: async () => {
        throw new Error("fetch failed");
      },
    });
    await expect(handleContact(valid, ctx(deps))).resolves.toEqual({
      ok: false,
      reason: "captcha",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("passa o token e o IP para o captcha", async () => {
    const { deps, verifyCaptcha } = makeDeps();
    await handleContact(valid, ctx(deps));
    expect(verifyCaptcha).toHaveBeenCalledWith(
      "XXXX.DUMMY.TOKEN.XXXX",
      "203.0.113.7",
    );
  });

  it("falha no envio vira send_failed e o log não tem dado pessoal", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { deps } = makeDeps({
      send: async () => {
        throw new Error(
          `550 rejeitado: joao+portfolio@exemplo.com disse "${valid.message}"`,
        );
      },
    });
    const result = await handleContact(valid, ctx(deps));
    expect(result).toEqual({ ok: false, reason: "send_failed" });

    logContactResult("req-123", result);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = errorSpy.mock.calls.flat().map(String).join(" ");
    expect(logged).toContain("req-123");
    expect(logged).toContain("falha:smtp");
    expect(logged).not.toContain("joao");
    expect(logged).not.toContain("exemplo.com");
    expect(logged).not.toContain("olá");
    expect(logged).not.toContain("203.0.113.7");
    expect(logged).not.toContain("550");
  });
});

describe("describeResult / logContactResult", () => {
  it("dá um rótulo curto para cada resultado", () => {
    expect(describeResult({ ok: true })).toBe("enviado");
    expect(describeResult({ ok: false, reason: "spam" })).toBe(
      "bloqueado:spam",
    );
    expect(describeResult({ ok: false, reason: "rate_limited" })).toBe(
      "bloqueado:rate-limit",
    );
    expect(describeResult({ ok: false, reason: "captcha" })).toBe(
      "bloqueado:captcha",
    );
    expect(
      describeResult({ ok: false, reason: "invalid", fields: ["email"] }),
    ).toBe("invalido");
    expect(describeResult({ ok: false, reason: "send_failed" })).toBe(
      "falha:smtp",
    );
  });

  it("loga só requestId e resultado, em JSON", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    logContactResult("req-1", { ok: true });
    expect(infoSpy).toHaveBeenCalledWith(
      JSON.stringify({ requestId: "req-1", result: "enviado" }),
    );
  });

  it("os campos de um envio inválido não entram no log", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logContactResult("req-2", {
      ok: false,
      reason: "invalid",
      fields: ["email"],
    });
    expect(warnSpy).toHaveBeenCalledWith(
      JSON.stringify({ requestId: "req-2", result: "invalido" }),
    );
  });
});
