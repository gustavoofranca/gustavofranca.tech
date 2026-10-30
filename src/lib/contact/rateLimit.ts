type Options = {
  limit: number;
  windowMs: number;
  now?: () => number;
  // Teto de chaves na memória: sem ele, muitos IPs diferentes fariam o mapa crescer sem fim.
  maxKeys?: number;
};

type Window = { count: number; resetAt: number };

// Janela fixa por chave (IP), em memória. Basta para um único container; reiniciar
// o processo zera os contadores, o que é aceitável para um formulário de contato.
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: Options) {
  const windows = new Map<string, Window>();

  function makeRoom(time: number) {
    for (const [key, window] of windows) {
      if (time >= window.resetAt) windows.delete(key);
    }
    // Ainda cheio: descarta a janela mais antiga (o Map guarda a ordem de inserção).
    const oldest = windows.keys().next();
    if (windows.size >= maxKeys && !oldest.done) windows.delete(oldest.value);
  }

  return {
    // true = permitido.
    hit(key: string): boolean {
      const time = now();
      const current = windows.get(key);
      if (current && time < current.resetAt) {
        if (current.count >= limit) return false;
        windows.set(key, { ...current, count: current.count + 1 });
        return true;
      }
      windows.delete(key);
      if (windows.size >= maxKeys) makeRoom(time);
      windows.set(key, { count: 1, resetAt: time + windowMs });
      return true;
    },
    size(): number {
      return windows.size;
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
