import type { Dictionary } from "./pt";

const en = {
  meta: {
    siteName: "Gustavo França",
    jobTitle: "Full-stack Developer",
    homeDescription:
      "Portfolio of Gustavo França, full-stack developer: projects, case studies and contact.",
    projectsDescription:
      "Projects by Gustavo França with case studies: context, architecture, challenges and results.",
    aboutDescription:
      "Who Gustavo França is: education, background, languages and the stack he uses, with the projects that back up each technology.",
    contactDescription:
      "Get in touch with Gustavo França, full-stack developer: contact form, email and GitHub.",
    privacyDescription:
      "How Gustavo França's site handles your data: the form sends and stores nothing, and this site sets no cookies.",
    ogImageAlt: "Share card: {title}",
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
    role: "Full\u2011stack developer: web, APIs and mobile.",
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
    fullStack: "See full stack",
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
    languages: "// languages",
    links: "// direct links",
    courses: "// courses",
  },
  stack: {
    title: "What I work with",
    usedIn: "used in",
    levelLegend: "Knowledge level legend",
    levelOf: ", level: {level}",
    levels: {
      basic: "basic",
      intermediate: "intermediate",
      advanced: "advanced",
    },
  },
  about: {
    title: "About me",
    expected: "expected",
    kinds: {
      work: "Work",
      education: "Education",
      incubator: "Incubator",
      venture: "Own business",
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
      label: "Contact form",
      name: "Name",
      email: "Email",
      message: "Message",
      messageHint: "10 to 4,000 characters.",
      honeypot: "Leave this field empty",
      send: "Send message",
      sending: "Sending...",
      success: "Message sent. I'll reply soon.",
      errors: {
        nameRequired: "Please enter your name.",
        nameTooLong: "Use at most 80 characters for your name.",
        nameInvalid:
          "Remove the line break or special character from your name.",
        emailInvalid: "Enter a valid email, like name@example.com.",
        messageTooShort: "Write at least 10 characters.",
        messageTooLong: "Use at most 4,000 characters.",
        invalid:
          "Check the fields: name, a valid email and a message of 10 to 4,000 characters.",
        captchaPending:
          "Wait for the anti-spam check to finish, then send again.",
        captcha:
          "Couldn't confirm you're a person. The check needs JavaScript: reload the page and try again, or write to {email}.",
        tooManyRequests:
          "Too many attempts. Please try again in a few minutes.",
        generic: "Couldn't send right now. Try again or write to {email}.",
      },
    },
    copyEmail: "Copy email",
    emailCopied: "Email copied",
    copyFailed: "Couldn't copy. The email is right next to this button.",
    github: "GitHub",
    whatsapp: "Chat on WhatsApp",
  },
  privacy: {
    title: "Privacy",
    intro:
      "What happens to your data on this site. The page is short because the site collects little.",
    sections: [
      {
        heading: "Contact form",
        paragraphs: [
          "When you send the form, your name, email and message go straight to {email} by email. The site stores nothing in a database: it sends and forgets.",
          "The message stays in my inbox, like any email you'd send me, and I use your address only to reply.",
        ],
      },
      {
        heading: "Spam protection",
        paragraphs: [
          "To block bots, the form uses Cloudflare Turnstile. To run this check, Cloudflare receives technical data from your browser and your IP address, under the Turnstile privacy policy.",
          "Your IP also stays in the server's memory during the one-hour window that limits each address to 5 messages; the window is deleted at most one minute after it ends. It is never written to disk.",
        ],
      },
      {
        heading: "Logs",
        paragraphs: [
          "The server logs only a random identifier for each submission and its result (sent or blocked). Name, email, message and IP are not in these logs.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "This site sets no cookies. Your theme choice (light or dark) is kept only in your browser, and goes away when you clear the site's data. Cloudflare Turnstile is a third-party service that loads only on the contact page and follows its own privacy policy.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Under Brazil's LGPD, you can ask for a copy or the deletion of a message you sent me. Write to {email}.",
        ],
      },
    ],
    turnstilePolicy: "Cloudflare Turnstile privacy policy",
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
    label: "Command palette",
    loadError: "Couldn't load the palette.",
    retry: "Try again",
    copied: "Email copied",
    copyFailed: "Couldn't copy. The email is",
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
      hireMe: "Hire Gustavo",
    },
  },
  footer: {
    rights: "All rights reserved.",
    privacy: "Privacy",
    builtWith: "Built with Astro and React.",
  },
} satisfies Dictionary;

export default en;
