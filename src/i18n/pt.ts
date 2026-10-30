// Fonte dos textos de interface. O `en.ts` é tipado a partir daqui: chave
// faltando lá quebra o `npm run check`. Fatos sobre o Gustavo ficam no conteúdo
// (src/content), não aqui.
const pt = {
  meta: {
    siteName: "Gustavo França",
    jobTitle: "Engenheiro de Software",
    homeDescription:
      "Portfólio de Gustavo França, engenheiro de software: projetos, estudos de caso e contato.",
    projectsDescription:
      "Projetos de Gustavo França com estudo de caso: contexto, arquitetura, desafios e resultado.",
    aboutDescription:
      "Quem é Gustavo França: formação, trajetória, idiomas e a stack que usa, com os projetos que provam cada tecnologia.",
    contactDescription:
      "Fale com Gustavo França, engenheiro de software: formulário de contato, e-mail e GitHub.",
    privacyDescription:
      "Como o site de Gustavo França trata os seus dados: o formulário envia e não guarda nada, e o site não grava cookies.",
    // Texto alternativo da imagem Open Graph. {title} é o título completo da página.
    ogImageAlt: "Cartão de compartilhamento: {title}",
  },
  a11y: {
    skipToContent: "Pular para o conteúdo",
    mainNav: "Navegação principal",
    homeLink: "Gustavo França, página inicial",
  },
  nav: {
    home: "Início",
    projects: "Projetos",
    about: "Sobre",
    contact: "Contato",
  },
  theme: {
    toggle: "Alternar tema",
  },
  language: {
    switchLabel: "Mudar idioma",
    pt: "Português",
    en: "English",
  },
  hero: {
    available: "disponível para oportunidades",
    // \u2011 é hífen inseparável: a linha não quebra em "full-/stack".
    role: "Engenheiro de Software full\u2011stack: web, APIs e mobile.",
    seeProjects: "Ver projetos",
    downloadCv: "Baixar CV",
    talkToMe: "Falar comigo",
  },
  // Saída de terminal: igual nos dois idiomas, decorativa (aria-hidden).
  terminal: {
    title: "gustavo@franca: ~",
    firstCommand: "cat stack.json",
    secondCommand: "open lumina --live",
  },
  home: {
    allProjects: "Todos os projetos",
    fullStack: "Stack completa",
    fullTimeline: "Trajetória completa",
    present: "atual",
    contactText: "Tem uma vaga ou um projeto em mente? Me escreva.",
  },
  sections: {
    featuredProjects: "// projetos em destaque",
    stack: "// stack",
    timeline: "// trajetória",
    contact: "// contato",
    allProjects: "// projetos",
    academicArchive: "// arquivo acadêmico",
    languages: "// idiomas",
    links: "// links diretos",
    courses: "// cursos",
  },
  stack: {
    usedIn: "usado em",
  },
  about: {
    title: "Sobre mim",
    // Uma data de término no futuro vira "previsão" (formatura, por exemplo).
    expected: "previsão",
    kinds: {
      work: "Trabalho",
      education: "Formação",
      incubator: "Incubadora",
      venture: "Negócio próprio",
    },
  },
  projects: {
    title: "Projetos",
    intro:
      "Estudos de caso do que construí: contexto, decisões de arquitetura e resultado.",
    all: "Todos",
    filterLabel: "Filtrar projetos",
    kindLabel: "Tipo",
    stackLabel: "Tecnologia",
    kinds: { web: "Web", api: "API", mobile: "Mobile" },
    // {shown} e {total} são trocados no navegador.
    shown: "Mostrando {shown} de {total}",
    meta: {
      kind: "Tipo",
      role: "Papel",
      period: "Período",
      status: "Situação",
    },
    offline: "fora do ar",
    archived: "arquivado",
    links: "Links do projeto",
    diagramScroll: "Diagrama de arquitetura, role para os lados",
    stackList: "Tecnologias usadas",
    viewCaseStudy: "Ver estudo de caso",
    demo: "Demo",
    code: "Código",
    live: "no ar",
    inTeam: "em equipe",
    solo: "solo",
    empty: "Nenhum projeto com esse filtro.",
  },
  contact: {
    title: "Vamos conversar",
    intro: "Escreva e eu respondo por e-mail.",
    form: {
      label: "Formulário de contato",
      name: "Nome",
      email: "E-mail",
      message: "Mensagem",
      messageHint: "De 10 a 4000 caracteres.",
      // Campo-isca escondido: só robô preenche.
      honeypot: "Deixe este campo vazio",
      send: "Enviar mensagem",
      sending: "Enviando...",
      success: "Mensagem enviada. Respondo em breve.",
      // {email} é trocado pelo e-mail de contato (src/lib/site.ts).
      errors: {
        nameRequired: "Informe seu nome.",
        nameTooLong: "Use no máximo 80 caracteres no nome.",
        nameInvalid: "Tire a quebra de linha ou o caractere especial do nome.",
        emailInvalid: "Informe um e-mail válido, como nome@exemplo.com.",
        messageTooShort: "Escreva pelo menos 10 caracteres.",
        messageTooLong: "Use no máximo 4000 caracteres.",
        invalid:
          "Confira os campos: nome, e-mail válido e mensagem de 10 a 4000 caracteres.",
        captchaPending:
          "Espere a verificação anti-spam terminar e envie de novo.",
        captcha:
          "Não deu para confirmar que você é uma pessoa. A verificação precisa de JavaScript: recarregue a página e tente de novo, ou escreva para {email}.",
        tooManyRequests: "Muitas tentativas. Tente de novo em alguns minutos.",
        generic:
          "Não foi possível enviar agora. Tente de novo ou escreva para {email}.",
      },
    },
    copyEmail: "Copiar e-mail",
    emailCopied: "E-mail copiado",
    copyFailed: "Não consegui copiar. O e-mail está aqui ao lado.",
    github: "GitHub",
    whatsapp: "Conversar no WhatsApp",
  },
  // Página de privacidade. {email} é trocado pelo e-mail de contato.
  privacy: {
    title: "Privacidade",
    intro:
      "O que acontece com os seus dados neste site. A página é curta porque o site coleta pouco.",
    sections: [
      {
        heading: "Formulário de contato",
        paragraphs: [
          "Quando você envia o formulário, o nome, o e-mail e a mensagem vão direto por e-mail para {email}. O site não guarda nada em banco de dados: envia e esquece.",
          "A mensagem fica na minha caixa de entrada, como qualquer e-mail que você me mandasse, e uso o seu endereço só para responder.",
        ],
      },
      {
        heading: "Proteção contra spam",
        paragraphs: [
          "Para barrar robôs, o formulário usa o Cloudflare Turnstile. Para fazer essa verificação, o Cloudflare recebe dados técnicos do seu navegador e o seu endereço IP, conforme a política de privacidade do Turnstile.",
          "O seu IP também fica na memória do servidor durante a janela de uma hora que limita cada endereço a 5 envios; ela é apagada no máximo um minuto depois de vencer. Ele não é gravado em disco.",
        ],
      },
      {
        heading: "Registros",
        paragraphs: [
          "O servidor registra só um identificador aleatório de cada envio e o resultado (enviado ou bloqueado). Nome, e-mail, mensagem e IP não entram nesses registros.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "Este site não grava cookies. A sua escolha de tema (claro ou escuro) fica guardada só no seu navegador, e some quando você limpa os dados do site. O Turnstile, do Cloudflare, é um serviço de terceiro que carrega só na página de contato e segue a política de privacidade dele.",
        ],
      },
      {
        heading: "Seus direitos",
        paragraphs: [
          "Pela LGPD, você pode pedir uma cópia ou a exclusão de uma mensagem que me enviou. Escreva para {email}.",
        ],
      },
    ],
    turnstilePolicy: "Política de privacidade do Cloudflare Turnstile",
  },
  notFound: {
    title: "404",
    command: "command not found",
    description: "Essa página não existe ou mudou de lugar.",
    backHome: "Voltar ao início",
  },
  palette: {
    open: "Abrir paleta de comandos",
    placeholder: "Digite um comando ou busque...",
    label: "Paleta de comandos",
    loadError: "Não consegui carregar a paleta.",
    retry: "Tentar de novo",
    copied: "E-mail copiado",
    copyFailed: "Não foi possível copiar. O e-mail é",
    empty: "Nada encontrado.",
    groups: {
      navigate: "Navegar",
      projects: "Projetos",
      actions: "Ações",
    },
    actions: {
      toggleTheme: "Alternar tema",
      switchLanguage: "Mudar para English",
      copyEmail: "Copiar e-mail",
      hireMe: "Contratar o Gustavo",
    },
  },
  footer: {
    rights: "Todos os direitos reservados.",
    privacy: "Privacidade",
    builtWith: "Feito com Astro e React.",
  },
};

export type Dictionary = typeof pt;

export default pt;
