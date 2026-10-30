// Lista de exceções do `npm audit` (scripts/audit-deps.mjs). Alerta alto ou crítico só
// passa se estiver na lista, com motivo e data de revisão; vencida a data, volta a
// bloquear. As dependências de produção são auditadas à parte, sem lista nenhuma.
// Sem imports e só sintaxe "apagável": o Node 24 roda este arquivo direto.
// https://docs.npmjs.com/cli/v11/commands/npm-audit

export interface AllowedAdvisory {
  id: string;
  package: string;
  reason: string;
  // AAAA-MM-DD. Depois desta data o alerta volta a falhar o CI.
  reviewBy: string;
}

export interface AuditVerdict {
  blocking: string[];
  expired: string[];
  // Na lista, mas fora do relatório: a correção chegou e a exceção pode sair.
  stale: string[];
}

interface Advisory {
  id: string;
  name: string;
  severity: string;
  title: string;
}

const BLOCKING_SEVERITIES = new Set(["high", "critical"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Cada pacote vulnerável lista em `via` os alertas próprios (objetos) e os pacotes
// pelos quais herdou o problema (strings). Só os objetos são alertas.
function advisoriesOf(report: unknown): Advisory[] {
  if (!isRecord(report) || !isRecord(report["vulnerabilities"])) {
    throw new Error("npm audit --json em formato inesperado.");
  }
  const found = new Map<string, Advisory>();
  for (const entry of Object.values(report["vulnerabilities"])) {
    const via =
      isRecord(entry) && Array.isArray(entry["via"]) ? entry["via"] : [];
    for (const item of via) {
      if (!isRecord(item) || typeof item["url"] !== "string") continue;
      const id = item["url"].split("/").pop() ?? item["url"];
      found.set(id, {
        id,
        name: String(item["name"]),
        severity: String(item["severity"]),
        title: String(item["title"]),
      });
    }
  }
  return [...found.values()];
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// AAAA-MM-DD e data que existe (2027-02-30 não passa).
function isRealIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year = 0, month = 0, day = 0] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Valida o JSON da lista antes de usar. Sem isso a conferência de prazo falha aberta:
// comparar texto sem formato ("30/01/2027") ou `undefined` nunca vence, e a exceção
// valeria para sempre. Erro aqui derruba o CI com a entrada apontada.
export function parseAllowlist(raw: unknown): AllowedAdvisory[] {
  if (!Array.isArray(raw)) {
    throw new Error("audit-allowlist.json deve ser uma lista de exceções.");
  }
  return raw.map((entry: unknown, index) => {
    const label = `audit-allowlist.json, item ${index + 1}`;
    if (!isRecord(entry)) throw new Error(`${label}: deveria ser um objeto.`);
    const named =
      typeof entry["id"] === "string" && entry["id"] !== ""
        ? `${label} (${entry["id"]})`
        : label;
    for (const field of ["id", "package", "reason"] as const) {
      const value = entry[field];
      if (typeof value !== "string" || value.trim() === "") {
        throw new Error(
          `${named}: "${field}" é obrigatório e não pode ser vazio.`,
        );
      }
    }
    const reviewBy = entry["reviewBy"];
    if (typeof reviewBy !== "string" || !isRealIsoDate(reviewBy)) {
      throw new Error(
        `${named}: "reviewBy" deve ser uma data real no formato AAAA-MM-DD (veio ${JSON.stringify(reviewBy)}).`,
      );
    }
    return {
      id: entry["id"] as string,
      package: entry["package"] as string,
      reason: entry["reason"] as string,
      reviewBy,
    };
  });
}

export function checkAudit(
  report: unknown,
  rawAllowlist: readonly AllowedAdvisory[],
  today: string,
): AuditVerdict {
  const allowlist = parseAllowlist(rawAllowlist);
  const advisories = advisoriesOf(report);
  const allowed = new Map(allowlist.map((entry) => [entry.id, entry]));
  const verdict: AuditVerdict = { blocking: [], expired: [], stale: [] };

  for (const advisory of advisories) {
    if (!BLOCKING_SEVERITIES.has(advisory.severity)) continue;
    const label = `${advisory.id} (${advisory.severity}, ${advisory.name}): ${advisory.title}`;
    const entry = allowed.get(advisory.id);
    if (!entry) verdict.blocking.push(label);
    else if (entry.reviewBy < today) verdict.expired.push(label);
  }

  const present = new Set(advisories.map((advisory) => advisory.id));
  verdict.stale = allowlist
    .map((entry) => entry.id)
    .filter((id) => !present.has(id));
  return verdict;
}
