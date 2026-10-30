import { describe, expect, it } from "vitest";
import {
  clientIp,
  feedbackKey,
  formToInput,
  isAllowedOrigin,
  localeOf,
  parseResult,
  redirectLocation,
  requestKind,
  statusCode,
} from "@/lib/contact/request";

describe("requestKind", () => {
  it("reconhece JSON (ilha) e formulário nativo (sem JS)", () => {
    expect(requestKind("application/json")).toBe("json");
    expect(requestKind("application/json; charset=utf-8")).toBe("json");
    expect(requestKind("application/x-www-form-urlencoded")).toBe("form");
    expect(requestKind("Application/X-WWW-Form-Urlencoded;charset=UTF-8")).toBe(
      "form",
    );
  });

  it("recusa o resto", () => {
    expect(requestKind(null)).toBeNull();
    expect(requestKind("multipart/form-data; boundary=x")).toBeNull();
    expect(requestKind("text/plain")).toBeNull();
  });
});

describe("formToInput", () => {
  it("converte o POST nativo no mesmo formato da ilha", () => {
    const form = new URLSearchParams({
      name: "Ana",
      email: "ana@exemplo.com",
      message: "Olá, tudo bem com você?",
      locale: "en",
      website: "",
      startedAt: "1700000000000",
      "cf-turnstile-response": "tok",
    });
    expect(formToInput(form)).toEqual({
      name: "Ana",
      email: "ana@exemplo.com",
      message: "Olá, tudo bem com você?",
      locale: "en",
      website: "",
      startedAt: 1_700_000_000_000,
      turnstileToken: "tok",
    });
  });

  it("startedAt vazio (sem JS) some; sem widget o token vem vazio", () => {
    const input = formToInput(
      new URLSearchParams({ name: "Ana", website: "", startedAt: "" }),
    );
    expect(input).not.toHaveProperty("startedAt");
    expect(input["turnstileToken"]).toBe("");
  });

  it("startedAt que não é número segue como texto para o schema recusar", () => {
    expect(
      formToInput(new URLSearchParams({ startedAt: "ontem" }))["startedAt"],
    ).toBe("ontem");
  });

  it("mantém campos extras para o schema estrito recusar", () => {
    expect(formToInput(new URLSearchParams({ admin: "1" }))).toHaveProperty(
      "admin",
      "1",
    );
  });
});

describe("clientIp", () => {
  it("com um proxy só (Caddy), usa o valor que ele escreveu: o último da lista", () => {
    expect(clientIp("203.0.113.7", "172.18.0.2")).toBe("203.0.113.7");
    expect(clientIp("6.6.6.6, 203.0.113.7", "172.18.0.2")).toBe("203.0.113.7");
    expect(clientIp(" 203.0.113.7 ", undefined)).toBe("203.0.113.7");
  });

  it("sem cabeçalho, cai no endereço da conexão", () => {
    expect(clientIp(null, "127.0.0.1")).toBe("127.0.0.1");
    expect(clientIp("", "127.0.0.1")).toBe("127.0.0.1");
    expect(clientIp(null, undefined)).toBe("desconhecido");
  });
});

describe("isAllowedOrigin", () => {
  it("aceita o domínio do site e a própria origem do servidor", () => {
    expect(
      isAllowedOrigin("https://gustavofranca.tech", "http://localhost:4321"),
    ).toBe(true);
    expect(
      isAllowedOrigin("http://localhost:4321", "http://localhost:4321"),
    ).toBe(true);
  });

  it("recusa outra origem ou origem ausente", () => {
    expect(
      isAllowedOrigin("https://evil.example", "http://localhost:4321"),
    ).toBe(false);
    expect(
      isAllowedOrigin("https://gustavofranca.tech.evil.example", "http://x"),
    ).toBe(false);
    expect(isAllowedOrigin(null, "http://localhost:4321")).toBe(false);
    expect(isAllowedOrigin("null", "http://localhost:4321")).toBe(false);
  });
});

describe("localeOf", () => {
  it("usa o idioma do formulário e cai em pt no resto", () => {
    expect(localeOf({ locale: "en" })).toBe("en");
    expect(localeOf({ locale: "pt" })).toBe("pt");
    expect(localeOf({ locale: "es" })).toBe("pt");
    expect(localeOf(null)).toBe("pt");
  });
});

describe("redirectLocation", () => {
  it("leva para a página de contato do idioma, com status e âncora da mensagem", () => {
    expect(redirectLocation({ ok: true }, "pt")).toBe(
      "/contato?status=enviado#contato-enviado",
    );
    expect(redirectLocation({ ok: true }, "en")).toBe(
      "/en/contact?status=enviado#contato-enviado",
    );
    expect(redirectLocation({ ok: false, reason: "rate_limited" }, "pt")).toBe(
      "/contato?status=erro&motivo=rate_limited#contato-erro-rate_limited",
    );
    expect(
      redirectLocation(
        { ok: false, reason: "invalid", fields: ["name"] },
        "en",
      ),
    ).toBe("/en/contact?status=erro&motivo=invalid#contato-erro-invalid");
  });
});

describe("statusCode", () => {
  it("mapeia o resultado para o status HTTP da resposta JSON", () => {
    expect(statusCode({ ok: true })).toBe(200);
    expect(statusCode({ ok: false, reason: "invalid" })).toBe(400);
    expect(statusCode({ ok: false, reason: "spam" })).toBe(400);
    expect(statusCode({ ok: false, reason: "captcha" })).toBe(400);
    expect(statusCode({ ok: false, reason: "rate_limited" })).toBe(429);
    expect(statusCode({ ok: false, reason: "send_failed" })).toBe(502);
  });
});

describe("parseResult", () => {
  it("aceita só respostas no formato de ContactResult", () => {
    expect(parseResult({ ok: true })).toEqual({ ok: true });
    expect(
      parseResult({ ok: false, reason: "invalid", fields: ["name"] }),
    ).toEqual({ ok: false, reason: "invalid", fields: ["name"] });
    expect(parseResult({ ok: false, reason: "outro" })).toBeNull();
    expect(parseResult("<html>")).toBeNull();
  });
});

describe("feedbackKey", () => {
  it("escolhe a mensagem do dicionário para cada resultado", () => {
    expect(feedbackKey({ ok: true })).toBe("success");
    expect(feedbackKey({ ok: false, reason: "invalid" })).toBe("invalid");
    expect(feedbackKey({ ok: false, reason: "captcha" })).toBe("captcha");
    expect(feedbackKey({ ok: false, reason: "rate_limited" })).toBe(
      "tooManyRequests",
    );
    expect(feedbackKey({ ok: false, reason: "spam" })).toBe("generic");
    expect(feedbackKey({ ok: false, reason: "send_failed" })).toBe("generic");
    expect(feedbackKey(null)).toBe("generic");
  });
});
