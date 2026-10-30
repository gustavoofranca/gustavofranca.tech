import { describe, expect, it, vi } from "vitest";
import { SITEVERIFY_URL, verifyTurnstile } from "@/lib/contact/turnstile";

const TEST_SECRET = "1x0000000000000000000000000000000AA";

function fakeFetch(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
}

describe("verifyTurnstile", () => {
  it("faz POST para o siteverify com secret, response e remoteip e devolve success", async () => {
    const fetchImpl = fakeFetch({ success: true });
    await expect(
      verifyTurnstile("token-abc", "203.0.113.7", TEST_SECRET, fetchImpl),
    ).resolves.toBe(true);

    expect(SITEVERIFY_URL).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("secret")).toBe(TEST_SECRET);
    expect(body.get("response")).toBe("token-abc");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("devolve false quando o Cloudflare recusa", async () => {
    await expect(
      verifyTurnstile("t", "1.1.1.1", "s", fakeFetch({ success: false })),
    ).resolves.toBe(false);
  });

  it("devolve false com resposta HTTP de erro ou corpo inesperado", async () => {
    await expect(
      verifyTurnstile(
        "t",
        "1.1.1.1",
        TEST_SECRET,
        fakeFetch({ success: true }, 500),
      ),
    ).resolves.toBe(false);
    await expect(
      verifyTurnstile("t", "1.1.1.1", "s", fakeFetch({ ok: "sim" })),
    ).resolves.toBe(false);
  });

  it("token vazio (sem JS, widget não rodou) falha sem chamar a rede", async () => {
    const fetchImpl = fakeFetch({ success: true });
    await expect(verifyTurnstile("", "1.1.1.1", "s", fetchImpl)).resolves.toBe(
      false,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("token válido de outro domínio é recusado (chaves de produção)", async () => {
    const other = fakeFetch({ success: true, hostname: "evil.example" });
    await expect(
      verifyTurnstile("t", "1.1.1.1", "segredo-de-producao", other),
    ).resolves.toBe(false);
    const ours = fakeFetch({ success: true, hostname: "gustavofranca.tech" });
    await expect(
      verifyTurnstile("t", "1.1.1.1", "segredo-de-producao", ours),
    ).resolves.toBe(true);
    const missing = fakeFetch({ success: true });
    await expect(
      verifyTurnstile("t", "1.1.1.1", "segredo-de-producao", missing),
    ).resolves.toBe(false);
  });

  it("com o segredo de teste do Cloudflare, o hostname (example.com) não é checado", async () => {
    const fetchImpl = fakeFetch({ success: true, hostname: "example.com" });
    await expect(
      verifyTurnstile("t", "1.1.1.1", TEST_SECRET, fetchImpl),
    ).resolves.toBe(true);
  });

  it("IP desconhecido não vai para o Cloudflare", async () => {
    const fetchImpl = fakeFetch({ success: true });
    await verifyTurnstile("t", "desconhecido", TEST_SECRET, fetchImpl);
    const body = new URLSearchParams(
      String(fetchImpl.mock.calls[0]?.[1]?.body),
    );
    expect(body.has("remoteip")).toBe(false);
    expect(body.get("response")).toBe("t");
  });
});
