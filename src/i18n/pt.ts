// Fonte dos textos de interface. O `en.ts` é tipado a partir daqui: chave
// faltando lá quebra o `npm run check`. Fatos sobre o Gustavo ficam no conteúdo
// (src/content), não aqui.
const pt = {
  meta: {
    siteName: "Gustavo França",
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
    seeProjects: "Ver projetos",
    talkToMe: "Falar comigo",
  },
  sections: {
    featuredProjects: "// projetos em destaque",
    stack: "// stack",
    timeline: "// trajetória",
    contact: "// contato",
    academicArchive: "// arquivo acadêmico",
    about: "// sobre",
    experience: "// experiência",
    education: "// formação",
    languages: "// idiomas",
    links: "// links diretos",
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
  projects: {
    all: "Todos",
    filterLabel: "Filtrar projetos",
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
    command: "comando não encontrado",
    description: "Essa página não existe ou mudou de lugar.",
    backHome: "Voltar ao início",
  },
  palette: {
    open: "Abrir paleta de comandos",
    placeholder: "Digite um comando ou busque...",
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
