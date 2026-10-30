import type { Dictionary } from "./pt";

const en = {
  meta: {
    siteName: "Gustavo França",
    jobTitle: "Software Engineer",
    homeDescription:
      "Portfolio of Gustavo França, software engineer: projects, case studies and contact.",
    projectsDescription:
      "Projects by Gustavo França with case studies: context, architecture, challenges and results.",
  },
  a11y: {
    skipToContent: "Skip to content",
    mainNav: "Main navigation",
    homeLink: "Gustavo França, home page",
  },
  nav: {
    home: "Home",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    menuOpen: "Open menu",
    menuClose: "Close menu",
  },
  theme: {
    toggle: "Toggle theme",
  },
  language: {
    switchLabel: "Change language",
    pt: "Português",
    en: "English",
  },
  hero: {
    available: "open to opportunities",
    role: "Full\u2011stack software engineer: web, APIs and mobile.",
    seeProjects: "View projects",
    downloadCv: "Download CV",
    talkToMe: "Get in touch",
  },
  terminal: {
    title: "gustavo@franca: ~",
    firstCommand: "cat stack.json",
    secondCommand: "open lumina --live",
  },
  home: {
    allProjects: "All projects",
    fullStack: "Complete stack",
    fullTimeline: "Full timeline",
    present: "present",
    contactText: "Have a role or a project in mind? Write to me.",
  },
  sections: {
    featuredProjects: "// featured projects",
    stack: "// stack",
    timeline: "// timeline",
    contact: "// contact",
    allProjects: "// projects",
    academicArchive: "// academic archive",
    about: "// about",
    experience: "// experience",
    education: "// education",
    languages: "// languages",
    links: "// direct links",
  },
  stack: {
    title: "Stack by area",
    usedIn: "used in",
    areas: {
      front: "Front-end",
      back: "Back-end",
      cms: "CMS and web",
      mobile: "Mobile",
      dataInfra: "Data and infra",
    },
  },
  projects: {
    title: "Projects",
    intro:
      "Case studies of what I built: context, architecture decisions and results.",
    all: "All",
    filterLabel: "Filter projects",
    kindLabel: "Type",
    stackLabel: "Technology",
    kinds: { web: "Web", api: "API", mobile: "Mobile" },
    // {shown} and {total} are replaced in the browser.
    shown: "Showing {shown} of {total}",
    meta: { kind: "Type", role: "Role", period: "Period", status: "Status" },
    offline: "offline",
    archived: "archived",
    links: "Project links",
    diagramScroll: "Architecture diagram, scroll sideways",
    stackList: "Technologies used",
    viewCaseStudy: "Read the case study",
    demo: "Demo",
    code: "Code",
    live: "live",
    inTeam: "team project",
    solo: "solo",
    empty: "No projects match this filter.",
  },
  contact: {
    title: "Let's talk",
    intro: "Write to me and I'll reply by email.",
    form: {
      name: "Name",
      email: "Email",
      message: "Message",
      send: "Send message",
      sending: "Sending...",
      success: "Message sent. I'll reply soon.",
      errors: {
        nameRequired: "Please enter your name.",
        emailInvalid: "Please enter a valid email.",
        messageTooShort: "Please write a slightly longer message.",
        messageTooLong: "The message is over the character limit.",
        tooManyRequests:
          "Too many attempts. Please try again in a few minutes.",
        generic:
          "Couldn't send right now. Try again or write to the email below.",
      },
    },
    copyEmail: "Copy email",
    emailCopied: "Email copied",
  },
  notFound: {
    title: "404",
    command: "command not found",
    description: "This page doesn't exist or has moved.",
    backHome: "Back to home",
  },
  palette: {
    open: "Open command palette",
    placeholder: "Type a command or search...",
    empty: "Nothing found.",
    groups: {
      navigate: "Navigate",
      projects: "Projects",
      actions: "Actions",
    },
    actions: {
      toggleTheme: "Toggle theme",
      switchLanguage: "Switch to Português",
      copyEmail: "Copy email",
    },
  },
  footer: {
    rights: "All rights reserved.",
    privacy: "Privacy",
    builtWith: "Built with Astro and React.",
  },
} satisfies Dictionary;

export default en;
