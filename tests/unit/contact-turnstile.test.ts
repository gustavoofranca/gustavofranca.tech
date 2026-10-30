import { describe, expect, it, vi } from "vitest";
import { SITEVERIFY_URL, verifyTurnstile } from "@/lib/contact/turnstile";

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
      verifyTurnstile("token-abc", "203.0.113.7", "segredo", fetchImpl),
    ).resolves.toBe(true);

    expect(SITEVERIFY_URL).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("secret")).toBe("segredo");
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
      verifyTurnstile("t", "1.1.1.1", "s", fakeFetch({ success: true }, 500)),
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
});
