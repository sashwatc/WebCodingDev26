import React from "react";
import { ExternalLink } from "lucide-react";

const LIBRARIES = [
  { name: "React",           license: "MIT",        href: "https://react.dev/" },
  { name: "Vite",            license: "MIT",        href: "https://vitejs.dev/" },
  { name: "Spring Boot",     license: "Apache 2.0", href: "https://spring.io/projects/spring-boot" },
  { name: "Tailwind CSS",    license: "MIT",        href: "https://tailwindcss.com/" },
  { name: "shadcn/ui",       license: "MIT",        href: "https://ui.shadcn.com/" },
  { name: "Framer Motion",   license: "MIT",        href: "https://www.framer.com/motion/" },
  { name: "React Hook Form", license: "MIT",        href: "https://react-hook-form.com/" },
  { name: "Zod",             license: "MIT",        href: "https://zod.dev/" },
  { name: "TanStack Query",  license: "MIT",        href: "https://tanstack.com/query/latest" },
  { name: "date-fns",        license: "MIT",        href: "https://date-fns.org/" },
  { name: "Lucide React",    license: "ISC",        href: "https://lucide.dev/" },
  { name: "MongoDB",         license: "SSPL",       href: "https://www.mongodb.com/" },
];

const APIS = [
  {
    name: "Anthropic Claude API",
    description: "Used for AI-assisted search query parsing and found-item field suggestions.",
    href: "https://www.anthropic.com/",
  },
  {
    name: "Appwrite",
    description: "Optional authentication backend providing user accounts and session management.",
    href: "https://appwrite.io/",
  },
];

function SectionHeading({ children }) {
  return (
    <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground" style={{ letterSpacing: "-0.015em" }}>
      {children}
    </h2>
  );
}

function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="border-b border-border bg-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-foreground ${className}`}>
      {children}
    </td>
  );
}

export default function Sources() {
  return (
    <div className="page-shell max-w-4xl py-12">
      <div className="page-header max-w-2xl">
        <span className="page-kicker">Credits</span>
        <h1 className="page-title">Sources &amp; Credits</h1>
        <p className="page-subtitle">
          Open-source libraries, fonts, images, APIs, and tools used in this project.
        </p>
      </div>

      {/* Libraries & Frameworks */}
      <section className="mb-12">
        <SectionHeading>Libraries &amp; Frameworks</SectionHeading>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>License</Th>
              <Th>Link</Th>
            </tr>
          </thead>
          <tbody>
            {LIBRARIES.map((lib, i) => (
              <tr key={lib.name} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <Td><span className="font-medium">{lib.name}</span></Td>
                <Td>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {lib.license}
                  </span>
                </Td>
                <Td>
                  <a
                    href={lib.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {lib.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      {/* Fonts */}
      <section className="mb-12">
        <SectionHeading>Fonts</SectionHeading>
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          This project uses the <strong className="text-foreground">Inter</strong> typeface loaded via the system font stack
          (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">ui-sans-serif, system-ui, sans-serif</code>).
          No external font files are bundled or fetched at runtime. Inter is available under the{" "}
          <strong className="text-foreground">SIL Open Font License 1.1</strong>.
        </div>
      </section>

      {/* Images */}
      <section className="mb-12">
        <SectionHeading>Images</SectionHeading>
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          All item images are placeholder SVGs generated programmatically. No third-party images used.
          The school mark (<code className="rounded bg-muted px-1.5 py-0.5 text-xs">Spartan_Head.png</code>) is school property used for
          educational/demonstration purposes only and is not part of the open-source distribution.
        </div>
      </section>

      {/* APIs */}
      <section className="mb-12">
        <SectionHeading>APIs</SectionHeading>
        <div className="space-y-3">
          {APIS.map((api) => (
            <div key={api.name} className="rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{api.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{api.description}</p>
                </div>
                <a
                  href={api.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Visit
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="mb-12">
        <SectionHeading>Tools</SectionHeading>
        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Claude Code</strong> — AI coding assistant (Anthropic) used during development for
            scaffolding pages, writing accessible component patterns, and iterating on UI/UX.
            Claude Code does not appear in the production bundle; it is a development-time tool only.
          </p>
        </div>
      </section>
    </div>
  );
}
