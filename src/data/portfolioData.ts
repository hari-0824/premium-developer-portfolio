/* ==================================================================
   portfolioData — the single source of truth for the whole site.
   Every string, number, link, tag and image below is editable.
   Nothing here is duplicated inside a component.
   ================================================================== */

export type NavItem = { id: string; label: string; index: string };

export type Stat = { value: number; suffix: string; label: string };

export type Milestone = { year: string; title: string; note?: string };

export type Skill = {
  name: string;
  icon: GlyphKey;
  desc: string;
  /** 0 – 100, editable */
  level: number;
};

export type SkillGroup = { index: string; category: string; skills: Skill[] };

export type Project = {
  id: string;
  index: string;
  title: string;
  kicker: string;
  summary: string;
  image: string;
  imageAlt: string;
  tags: Array<"JAVA" | "WEB" | "AI" | "IOT">;
  tech: string[];
  links: { github: string; live: string };
  detail: {
    problem: string;
    solution: string;
    features: string[];
    stack: string[];
    contribution: string;
    future: string[];
  };
};

export type Achievement = {
  id: string;
  kind: "award" | "certification" | "workshop";
  glyph: "trophy" | "scroll" | "cap";
  title: string;
  organisation: string;
  /** set to false (and edit the string) once the real date is added */
  organisationIsPlaceholder: boolean;
  date: string;
  dateIsPlaceholder: boolean;
  description: string;
  tags?: string[];
};

export type JourneyStep = {
  year: string;
  title: string;
  note: string;
  state: "done" | "now" | "next";
};

export type GlyphKey =
  | "code"
  | "python"
  | "js"
  | "markup"
  | "style"
  | "react"
  | "spring"
  | "api"
  | "sql"
  | "mongo"
  | "git"
  | "ide"
  | "ai"
  | "vision"
  | "chip"
  | "sensor";

export const portfolioData = {
  /* ---------------------------------------------------- personal */
  personal: {
    firstName: "Hari Hara",
    lastName: "Sudhan D",
    fullName: "Hari Hara Sudhan",
    fullNameWithInitial: "Hari Hara Sudhan D",
    monogram: "HHS",
    role: "Java Full Stack Developer",
    status: "Computer Science Engineering Student",
    college: "Panimalar Engineering College, Chennai",
    graduation: "2028",
    badge: "Available for opportunities",

    /* PROFILE PHOTO — no photo has been uploaded yet, so the Hero shows a
       clearly marked placeholder. To use your real photo:
         1. save it as  public/images/profile.jpg   (portrait, 4:5 works best)
         2. set profilePhoto to "images/profile.jpg"
         3. set photoIsPlaceholder to false
       Your real image is used exactly as uploaded — it is never regenerated. */
    profilePhoto: "images/profile.jpg",
    profilePhotoAlt: "Portrait of Hari Hara Sudhan D, Java Full Stack Developer",
    photoIsPlaceholder: false,
    heroLead:
      "I build practical software solutions using Java, Spring Boot, React, AI and IoT.",
    intro:
      "Computer Science Engineering student passionate about Java, Full Stack Development, AI, IoT, and building practical software solutions.",
    goal:
      "Become a professional Java Full Stack Developer and build scalable, intelligent software products.",
    aboutBody: [
      "I am a Computer Science Engineering student at Panimalar Engineering College, Chennai, focused on becoming a professional Java Full Stack Developer.",
      "My work centres on Java development — core Java, advanced collections and Spring — paired with front-end work in React so I can own a feature from the database row all the way to the rendered screen.",
      "Beyond the web stack I spend time on AI and IoT: computer-vision models, AI APIs, ESP32 boards and real sensors. Those projects are where problem solving becomes tangible — a camera that classifies waste, a load cell that reports weight over a REST endpoint.",
      "I am most interested in building real-world applications: software that solves a measurable problem for a real user, rather than a demo that only runs on my machine.",
    ],
    goalLabel: "Career goal",
    timeline: [
      { year: "2024", title: "Started deeper journey into programming" },
      { year: "2025", title: "Expanded into Java, Python, web development and AI" },
      { year: "2026", title: "Building full-stack, AI and IoT projects" },
      { year: "2028", title: "Target graduation", note: "B.E. Computer Science Engineering" },
    ] as Milestone[],
  },

  /* ---------------------------------------------------------- nav */
  nav: [
    { id: "home", label: "Home", index: "00" },
    { id: "about", label: "About", index: "02" },
    { id: "skills", label: "Skills", index: "03" },
    { id: "projects", label: "Projects", index: "04" },
    { id: "achievements", label: "Achievements", index: "05" },
    { id: "journey", label: "Journey", index: "06" },
    { id: "resume", label: "Resume", index: "08" },
    { id: "contact", label: "Contact", index: "09" },
  ] as NavItem[],

  /* ------------------------------------------------------ socials */
  socials: {
    /* REPLACE the handles below with your real profiles. */
    github: "https://github.com/hari-0824",
    linkedin: "https://www.linkedin.com/in/hari-hara-sudhan-d/",
    email: "your.email@example.com",
    resumePdf: "resume/HARI_HARA_SUDHAN_D_Resume.pdf",
  },

  /* --------------------------------------------------------- stats */
  stats: [
    { value: 3, suffix: "+", label: "Years of Learning" },
    { value: 8, suffix: "+", label: "Projects" },
    { value: 0, suffix: "", label: "Certifications", display: "Multiple" },
    { value: 1, suffix: "st", label: "Hackathon Achievement" },
  ] as Array<Stat & { display?: string }>,

  /* -------------------------------------------------------- skills */
  skills: [
    {
      index: "3.1",
      category: "Programming",
      skills: [
        { name: "Java", icon: "code", level: 85, desc: "Core Java, OOP, collections & exception handling." },
        { name: "Python", icon: "python", level: 75, desc: "Scripting, automation and ML/experiment code." },
        { name: "JavaScript", icon: "js", level: 78, desc: "ES6+, DOM manipulation, async patterns." },
      ],
    },
    {
      index: "3.2",
      category: "Frontend",
      skills: [
        { name: "HTML", icon: "markup", level: 90, desc: "Semantic, accessible document structure." },
        { name: "CSS", icon: "style", level: 82, desc: "Flexbox, grid, responsive layout systems." },
        { name: "JavaScript", icon: "js", level: 78, desc: "Interactive UI behaviour and state." },
        { name: "React", icon: "react", level: 76, desc: "Components, hooks, props and state flow." },
      ],
    },
    {
      index: "3.3",
      category: "Backend",
      skills: [
        { name: "Java", icon: "code", level: 85, desc: "Service layer logic and domain modelling." },
        { name: "Spring Boot", icon: "spring", level: 74, desc: "Auto-configuration, JPA, layered architecture." },
        { name: "REST API", icon: "api", level: 77, desc: "Resource design, status codes, JSON contracts." },
      ],
    },
    {
      index: "3.4",
      category: "Database",
      skills: [
        { name: "MySQL", icon: "sql", level: 80, desc: "Schema design, joins, normalisation." },
        { name: "MongoDB", icon: "mongo", level: 68, desc: "Document modelling and NoSQL queries." },
      ],
    },
    {
      index: "3.5",
      category: "Tools",
      skills: [
        { name: "Git", icon: "git", level: 82, desc: "Branching, commits, pull requests." },
        { name: "GitHub", icon: "git", level: 82, desc: "Repos, issues, hosted collaboration." },
        { name: "VS Code", icon: "ide", level: 90, desc: "Daily editor for front-end work." },
        { name: "IntelliJ / Eclipse", icon: "ide", level: 84, desc: "Java and Spring Boot development." },
      ],
    },
    {
      index: "3.6",
      category: "AI & IoT",
      skills: [
        { name: "AI APIs", icon: "ai", level: 72, desc: "Gemini / LLM APIs for structured extraction." },
        { name: "Computer Vision", icon: "vision", level: 66, desc: "Image classification for real-world inputs." },
        { name: "ESP32", icon: "chip", level: 74, desc: "Wi-Fi microcontroller firmware & networking." },
        { name: "Sensors", icon: "sensor", level: 70, desc: "Load cells, HX711, environmental inputs." },
      ],
    },
  ] as Array<Omit<SkillGroup, "skills"> & { skills: Skill[] }>,

  /* ----------------------------------------------------- projects */
  projectFilters: ["ALL", "JAVA", "WEB", "AI", "IOT"] as const,

  projects: [
    {
      id: "ai-waste-management",
      index: "01",
      title: "AI Waste Management System",
      kicker: "Intelligence at the bin",
      summary:
        "An intelligent waste management solution combining AI and IoT for waste classification, monitoring and management.",
      image: "images/proj-waste.jpg",
      imageAlt:
        "Microcontroller board with a camera module mounted on an aluminium bracket on a dark workbench",
      tags: ["AI", "IOT", "WEB"],
      tech: ["AI", "IoT", "ESP32", "Computer Vision", "Web Dashboard"],
      links: { github: "https://github.com/hari-0824", live: "" },
      detail: {
        problem:
          "Waste segregation at the source is inconsistent, so collected material is contaminated and recycling rates drop. Manual sorting is slow, unhealthy and hard to scale across a city.",
        solution:
          "A camera classifies waste at the point of disposal while an ESP32 reports bin fill-level and classification counts to a web dashboard, giving operators one live view of every node.",
        features: [
          "Image-based waste classification using a computer-vision model",
          "ESP32 node reporting fill-level sensor readings over Wi-Fi",
          "Live web dashboard for bin status and classification history",
          "Threshold alerts when a bin approaches capacity",
          "Per-node history for route planning and reporting",
        ],
        stack: ["AI", "IoT", "ESP32", "Computer Vision", "Web Dashboard"],
        contribution:
          "Designed the classification flow, wrote the ESP32 firmware for sensor capture and transmission, and built the dashboard that renders the incoming data.",
        future: [
          "Retrain the classifier on locally collected, region-specific waste imagery",
          "Add offline buffering so nodes survive network loss",
          "Deploy route optimisation over the fill-level data",
          "Move the inference pipeline onto the edge device itself",
        ],
      },
    },
    {
      id: "ai-resume-analyzer",
      index: "02",
      title: "AI Resume Analyzer",
      kicker: "Structured signal from prose",
      summary:
        "An AI-powered resume analysis system that evaluates resumes and extracts structured career information.",
      image: "images/proj-resume.jpg",
      imageAlt:
        "A printed sheet of paper on a dark desk raked by hard cool light, showing paper fibre texture",
      tags: ["AI", "WEB", "JAVA"],
      tech: ["AI", "Gemini API", "Web Development", "JSON"],
      links: { github: "https://github.com/hari-0824", live: "" },
      detail: {
        problem:
          "Resumes are unstructured prose. Reviewing them manually is repetitive and inconsistent, and useful signals — skills, timeline, gaps — are hard to compare across candidates.",
        solution:
          "A web application sends the resume text to an AI model with a strict schema and receives typed JSON back: skills, experience entries, education and suggested improvements, rendered in a readable report.",
        features: [
          "Paste-or-upload resume intake",
          "Schema-constrained extraction into typed JSON",
          "Skills, education and timeline broken out as separate fields",
          "Role-match summary with highlighted gaps",
          "Shareable report view of the analysis",
        ],
        stack: ["AI", "Gemini API", "Web Development", "JSON"],
        contribution:
          "Designed the extraction prompt and JSON contract, built the front-end report UI, and wrote the validation layer that rejects malformed model output before it reaches the screen.",
        future: [
          "PDF parsing server-side so uploads work end-to-end",
          "Keyword gap analysis against a target job description",
          "Version history so a candidate can compare resume revisions",
          "Java/Spring Boot service layer to host the pipeline",
        ],
      },
    },
    {
      id: "iot-smart-scale",
      index: "03",
      title: "IoT Smart Scale",
      kicker: "Weight, transmitted",
      summary:
        "An ESP32-based smart weighing system using load cells and HX711 with real-time data transmission.",
      image: "images/proj-scale.jpg",
      imageAlt:
        "Macro photograph of an aluminium load cell bar bolted to a plate with thin wires on a dark bench",
      tags: ["IOT", "JAVA", "WEB"],
      tech: ["ESP32", "HX711", "IoT", "REST API"],
      links: { github: "https://github.com/hari-0824", live: "" },
      detail: {
        problem:
          "Ordinary scales display a number and lose it. There is no record, no remote reading and no way to trigger anything when a weight crosses a threshold.",
        solution:
          "A strain-gauge load cell read through an HX711 amplifier gives calibrated weight on an ESP32, which publishes readings to a REST endpoint so any client can consume them in real time.",
        features: [
          "Calibrated load-cell reading with tare support",
          "HX711 24-bit sampling with running-average filtering",
          "Wi-Fi transmission of readings to a REST API",
          "Threshold events when a target weight is crossed",
          "Client-agnostic endpoint — any dashboard can subscribe",
        ],
        stack: ["ESP32", "HX711", "IoT", "REST API"],
        contribution:
          "Wrote the firmware, performed the calibration and filtering work, and defined the REST contract the endpoint exposes.",
        future: [
          "Long-term storage and simple time-series charts",
          "Battery/sleep modes for portable deployment",
          "Multi-cell support for higher capacity platforms",
          "OTA firmware updates over Wi-Fi",
        ],
      },
    },
  ] as Project[],

  /* ------------------------------------------------- achievements */
  achievements: [
    {
      id: "hackathon",
      kind: "award",
      glyph: "trophy",
      title: "Hackathon Achievement — 1st Prize",
      organisation: "Smart City / IoT Hackathon",
      organisationIsPlaceholder: false,
      date: "Date to be added",
      dateIsPlaceholder: true,
      description:
        "First prize for an IoT-driven smart-city submission. Award recognised the working prototype and the approach to the problem statement.",
      tags: ["IoT", "Prototype", "Team"],
    },
    {
      id: "certifications",
      kind: "certification",
      glyph: "scroll",
      title: "Certifications",
      organisation: "Issuing organisation to be added",
      organisationIsPlaceholder: true,
      date: "Dates to be added",
      dateIsPlaceholder: true,
      description:
        "Course certifications completed and in progress. Replace each entry with the issuing body, credential ID and date once available.",
      tags: ["Python", "AI", "Web Development", "Other certifications"],
    },
    {
      id: "workshops",
      kind: "workshop",
      glyph: "cap",
      title: "Workshops & Technical Programs",
      organisation: "Host institution to be added",
      organisationIsPlaceholder: true,
      date: "Dates to be added",
      dateIsPlaceholder: true,
      description:
        "Technical workshops and development programs attended during the degree. Add the workshop name, host and date for each.",
      tags: ["Workshops", "Development Programs"],
    },
  ] as Achievement[],

  /* ------------------------------------------------------ journey */
  journey: [
    { year: "2024", title: "Programming Foundations", note: "First structured steps into programming logic and problem solving.", state: "done" },
    { year: "2025", title: "Python + Web Development", note: "Python alongside HTML, CSS and JavaScript for the browser.", state: "done" },
    { year: "2025", title: "Java Development", note: "Object-oriented Java became the primary language.", state: "done" },
    { year: "2026", title: "Advanced Java + Collections", note: "Collections framework, generics and deeper language mechanics.", state: "now" },
    { year: "2026", title: "React + Full Stack Development", note: "Component-driven front ends wired to real back-end services.", state: "now" },
    { year: "2026", title: "AI + IoT Projects", note: "Computer vision, AI APIs and ESP32 sensor systems.", state: "now" },
    { year: "2027", title: "Spring Boot + REST APIs", note: "Production-style services, JPA and API design.", state: "next" },
    { year: "2028", title: "Full Stack Developer", note: "Graduation target and career objective.", state: "next" },
  ] as JourneyStep[],

  /* ---------------------------------------------------- dashboard */

  /* ------------------------------------------------------- resume */
  resume: {
    fileName: "HARI_HARA_SUDHAN_D_Resume.pdf",
    fileUrl: "resume/HARI_HARA_SUDHAN_D_Resume.pdf",
    sections: [
      {
        title: "Education",
        rows: [
          "B.E. Computer Science Engineering — Panimalar Engineering College, Chennai",
          "Expected graduation: 2028",
        ],
      },
      {
        title: "Skills",
        rows: [
          "Languages: Java, Python, JavaScript",
          "Backend: Spring Boot, REST APIs",
          "Frontend: React, HTML, CSS",
          "Databases: MySQL, MongoDB",
          "AI & IoT: AI APIs, Computer Vision, ESP32, Sensors",
        ],
      },
      {
        title: "Projects",
        rows: [
          "AI Waste Management System — AI + IoT waste classification & monitoring",
          "AI Resume Analyzer — AI resume evaluation with structured JSON output",
          "IoT Smart Scale — ESP32 + HX711 weighing with REST transmission",
        ],
      },
      {
        title: "Achievements",
        rows: ["1st Prize — Smart City / IoT Hackathon"],
      },
      {
        title: "Certifications",
        rows: ["Python", "AI", "Web Development", "Other certifications"],
      },
      {
        title: "Experience",
        rows: ["No formal work experience yet — see Projects for applied work."],
      },
    ],
  },

  /* ------------------------------------------------------ contact */
  contact: {
    heading: "Let's Build Something.",
    body: "I'm always interested in learning, building and collaborating on meaningful technology projects.",
    responseNote: "Usually replies within a day.",
  },
};
