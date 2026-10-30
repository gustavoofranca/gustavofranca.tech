import { z } from "astro/zod";

// O z do código que vai para o navegador (ilha do formulário). Sem JIT: para compilar
// validadores, o Zod testa `new Function("")` assim que um z.object é criado, e a CSP
// (sem 'unsafe-eval') barra e reporta esse teste. Importar daqui garante a configuração
// antes do primeiro schema do módulo (allowsEval em zod/v4/core/util.js).
z.config({ jitless: true });

export { z };
