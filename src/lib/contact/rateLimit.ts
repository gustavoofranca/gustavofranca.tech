type Options = {
  limit: number;
  windowMs: number;
  now?: () => number;
  // Teto de chaves na memória: sem ele, muitos IPs diferentes numa mesma janela
  // fariam o mapa crescer sem fim.
  maxKeys?: number;
};

type Window = { count: number; resetAt: number };

// Janela fixa por chave (IP), em memória. Basta para um único container; reiniciar
// o processo zera os contadores, o que é aceitável para um formulário de contato.
// A página de privacidade promete que o IP não fica guardado depois da janela, então
// toda janela vencida é apagada: a cada hit e pelo sweep() periódico da rota.
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: Options) {
  const windows = new Map<string, Window>();

  // O mapa é pequeno (5 envios por IP por hora): varrer tudo é barato.
  function sweep(time = now()) {
    for (const [key, window] of windows) {
      if (time >= window.resetAt) windows.delete(key);
    }
  }

  return {
    // true = permitido.
    hit(key: string): boolean {
      const time = now();
      sweep(time);
      const current = windows.get(key);
      if (current) {
        if (current.count >= limit) return false;
        windows.set(key, { ...current, count: current.count + 1 });
        return true;
      }
      // Ainda cheio depois da varredura: descarta a janela mais antiga
      // (o Map guarda a ordem de inserção).
      const oldest = windows.keys().next();
      if (windows.size >= maxKeys && !oldest.done) windows.delete(oldest.value);
      windows.set(key, { count: 1, resetAt: time + windowMs });
      return true;
    },
    sweep(): void {
      sweep();
    },
    has(key: string): boolean {
      return windows.has(key);
    },
    size(): number {
      return windows.size;
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

// Cada assinante IPv6 costuma receber uma /64 inteira: limitar por endereço deixaria
// a mesma pessoa trocar de IP à vontade. IPv4 (e IPv4 mapeado em IPv6) fica como está.
export function rateLimitKey(ip: string): string {
  const address = ip.replace(/%.*$/, "").toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(address);
  if (mapped?.[1]) return mapped[1];
  if (!address.includes(":")) return ip;

  const halves = address.split("::");
  if (halves.length > 2) return ip;
  const toGroups = (part: string | undefined) =>
    part ? part.split(":").flatMap(expandEmbeddedIpv4) : [];
  const head = toGroups(halves[0]);
  const tail = toGroups(halves[1]);
  const missing = halves.length === 2 ? 8 - head.length - tail.length : 0;
  if (missing < 0) return ip;
  const groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  if (groups.length !== 8 || !groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
    return ip;
  }
  const prefix = groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, ""));
  return `${prefix.join(":")}::/64`;
}

// "64:ff9b::1.2.3.4": o IPv4 no fim ocupa dois grupos de 16 bits.
function expandEmbeddedIpv4(group: string): string[] {
  if (!group.includes(".")) return [group];
  const octets = group.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => !(o >= 0 && o <= 255))) {
    return [group];
  }
  const [a = 0, b = 0, c = 0, d = 0] = octets;
  return [((a << 8) | b).toString(16), ((c << 8) | d).toString(16)];
}
