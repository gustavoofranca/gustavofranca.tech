// Término depois do mês atual é previsão (formatura, por exemplo). Ambos "YYYY-MM",
// que ordenam como texto. `null` é "em andamento", não previsão.
export function isFutureMonth(end: string | null, now: string): boolean {
  return end !== null && end > now;
}

// Mês corrente em UTC, "YYYY-MM". A página é estática: o valor é o do momento do
// build, e UTC evita que o fuso da máquina de build mude o mês na virada.
export function currentMonthUtc(): string {
  return new Date().toISOString().slice(0, 7);
}
