import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
    <th className="border-b border-border bg-muted/50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground whitespace-nowrap">
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return (
    <td className={`px-4 py-3 text-foreground align-top ${className}`}>
      {children}
    </td>
  );
}

function Check() {
  return <span className="text-emerald-600 font-bold">✓</span>;
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function Code({ children }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
      {children}
    </code>
  );
}

const DEMO_ACCOUNTS = [
  { email: "staff.demo@pleasantvalley.edu",   role: "Staff",   password: "(demo mode, no password)" },
  { email: "student.demo@pleasantvalley.edu", role: "Student", password: "(demo mode, no password)" },
  { email: "avery.patel@pleasantvalley.edu",  role: "Admin",   password: "(demo mode, no password)" },
];

const ROLE_MATRIX = [
  { feature: "View found items",   student: true,  staff: true,  admin: true  },
  { feature: "Report found item",  student: true,  staff: true,  admin: true  },
  { feature: "Submit claim",       student: true,  staff: false, admin: false },
  { feature: "Review claims",      student: false, staff: true,  admin: true  },
  { feature: "Approve items",      student: false, staff: true,  admin: true  },
  { feature: "Pickup desk",        student: false, staff: true,  admin: true  },
  { feature: "Manage users",       student: false, staff: false, admin: true  },
];

const API_ENDPOINTS = [
  { method: "GET",    path: "/api/health",                 description: "Health check — returns 200 OK when the server is up" },
  { method: "GET",    path: "/api/items",                  description: "List found items; supports filter query params (category, color, status)" },
  { method: "POST",   path: "/api/items",                  description: "Create a new found-item record (staff/admin)" },
  { method: "GET",    path: "/api/items/{id}",             description: "Fetch a single found item by ID" },
  { method: "GET",    path: "/api/claims",                 description: "List claim submissions (staff/admin); students see own claims" },
  { method: "POST",   path: "/api/claims",                 description: "Submit a new claim for a found item" },
  { method: "GET",    path: "/api/auth/me",                description: "Return the currently authenticated user profile" },
  { method: "POST",   path: "/api/uploads",                description: "Upload a photo and receive its URL; returns { url }" },
  { method: "GET",    path: "/api/notifications",          description: "Fetch recovery-pulse notifications for the current user" },
  { method: "GET",    path: "/api/return-passes/{claimId}", description: "Get the pickup pass for an approved claim" },
  { method: "POST",   path: "/api/return-passes/verify",   description: "Verify a 6-digit PIN entered at the pickup desk" },
  { method: "POST",   path: "/api/return-passes/redeem",   description: "Redeem a verified PIN and mark the item as returned" },
  { method: "GET",    path: "/api/case-messages/{claimId}", description: "List staff/claimant messages for a claim case" },
  { method: "POST",   path: "/api/case-messages",          description: "Send a message in a claim case thread" },
  { method: "POST",   path: "/api/ai-assistance/parse",    description: "Parse a natural-language search query into structured filters" },
  { method: "GET",    path: "/api/admin/claims",           description: "Admin-only: list all claims with full detail for moderation" },
];

const METHOD_COLORS = {
  GET:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  POST:   "text-blue-700 bg-blue-50 border-blue-200",
  PUT:    "text-amber-700 bg-amber-50 border-amber-200",
  DELETE: "text-red-700 bg-red-50 border-red-200",
  PATCH:  "text-purple-700 bg-purple-50 border-purple-200",
};

export default function Documentation() {
  return (
    <div className="page-shell max-w-4xl py-12">
      <div className="page-header max-w-2xl">
        <span className="page-kicker">Developer guide</span>
        <h1 className="page-title">Documentation</h1>
        <p className="page-subtitle">
          Setup instructions, architecture overview, demo accounts, role permissions, and API reference.
        </p>
      </div>

      {/* Setup */}
      <section className="mb-12">
        <SectionHeading>Setup</SectionHeading>
        <div className="rounded-xl border border-border bg-card px-6 py-5">
          <ol className="space-y-4 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
              <span>
                Clone both repositories:
                <br />
                <Code>git clone https://github.com/your-org/WebCodingDev26</Code>
                <br />
                <Code>git clone https://github.com/your-org/WebCodingDev26-Backend</Code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
              <span>
                Start the backend (requires Java 17+, MongoDB running locally):
                <br />
                <Code>cd WebCodingDev26-Backend &amp;&amp; ./mvnw spring-boot:run</Code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
              <span>
                Install dependencies and start the frontend dev server:
                <br />
                <Code>cd WebCodingDev26 &amp;&amp; npm install &amp;&amp; VITE_API_URL=http://localhost:8080 npm run dev</Code>
                <br />
                Then open <Code>http://localhost:5173</Code> in your browser.
              </span>
            </li>
          </ol>
        </div>
      </section>

      {/* Architecture */}
      <section className="mb-12">
        <SectionHeading>Architecture</SectionHeading>
        <div className="rounded-xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>
            The <strong className="text-foreground">frontend</strong> is a React + Vite single-page app. It uses TanStack Query for
            server-state management, react-hook-form + Zod for validated forms, shadcn/ui (Radix) for accessible
            component primitives, Tailwind CSS for styling, and Framer Motion for animation.
            Client-side routing is handled by React Router v6.
          </p>
          <p>
            The <strong className="text-foreground">backend</strong> is a Spring Boot application with a MongoDB database.
            It exposes a REST API consumed exclusively by this frontend. Authentication is handled either through
            Appwrite (production) or a demo-mode fallback built into the backend for local development and judging.
          </p>
          <p>
            <strong className="text-foreground">Appwrite</strong> is an optional external authentication provider.
            When Appwrite is unavailable the app degrades gracefully: public item browsing remains fully functional
            and demo accounts authenticate through the backend fallback.
            LocalStorage is used for draft autosave, saved searches, theme preference, and reduced-motion preference.
          </p>
        </div>
      </section>

      {/* Demo Accounts */}
      <section className="mb-12">
        <SectionHeading>Demo Accounts</SectionHeading>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Password</Th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ACCOUNTS.map((acct, i) => (
              <tr key={acct.email} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <Td><Code>{acct.email}</Code></Td>
                <Td>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {acct.role}
                  </span>
                </Td>
                <Td className="text-muted-foreground">{acct.password}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      {/* Role Matrix */}
      <section className="mb-12">
        <SectionHeading>Role Matrix</SectionHeading>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Feature</Th>
              <Th>Student</Th>
              <Th>Staff</Th>
              <Th>Admin</Th>
            </tr>
          </thead>
          <tbody>
            {ROLE_MATRIX.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <Td className="font-medium">{row.feature}</Td>
                <Td className="text-center">{row.student ? <Check /> : <Dash />}</Td>
                <Td className="text-center">{row.staff   ? <Check /> : <Dash />}</Td>
                <Td className="text-center">{row.admin   ? <Check /> : <Dash />}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      {/* Key API Endpoints */}
      <section className="mb-12">
        <SectionHeading>Key API Endpoints</SectionHeading>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Method</Th>
              <Th>Path</Th>
              <Th>Description</Th>
            </tr>
          </thead>
          <tbody>
            {API_ENDPOINTS.map((ep, i) => (
              <tr key={`${ep.method}-${ep.path}`} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <Td>
                  <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-bold tracking-wide ${METHOD_COLORS[ep.method] || ""}`}>
                    {ep.method}
                  </span>
                </Td>
                <Td>
                  <Code>{ep.path}</Code>
                </Td>
                <Td className="text-muted-foreground">{ep.description}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      {/* Footer links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/Sources">Sources &amp; Credits</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/Accessibility">Accessibility Statement</Link>
        </Button>
      </div>
    </div>
  );
}
