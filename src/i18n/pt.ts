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
    menuOpen: "Abrir menu",
    menuClose: "Fechar menu",
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
    about: "// sobre",
    experience: "// experiência",
    education: "// formação",
    languages: "// idiomas",
    links: "// links diretos",
    courses: "// cursos",
  },
  stack: {
    title: "Stack por área",
    usedIn: "usado em",
    areas: {
      front: "Front-end",
      back: "Back-end",
      cms: "CMS e web",
      mobile: "Mobile",
      dataInfra: "Dados e infra",
    },
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
      name: "Nome",
      email: "E-mail",
      message: "Mensagem",
      send: "Enviar mensagem",
      sending: "Enviando...",
      success: "Mensagem enviada. Respondo em breve.",
      errors: {
        nameRequired: "Informe seu nome.",
        emailInvalid: "Informe um e-mail válido.",
        messageTooShort: "Escreva uma mensagem um pouco maior.",
        messageTooLong: "A mensagem passou do limite de caracteres.",
        tooManyRequests: "Muitas tentativas. Tente de novo em alguns minutos.",
        generic:
          "Não foi possível enviar agora. Tente de novo ou escreva para o e-mail abaixo.",
      },
    },
    copyEmail: "Copiar e-mail",
    emailCopied: "E-mail copiado",
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
