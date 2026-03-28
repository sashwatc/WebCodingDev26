import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-background" role="contentinfo">
      <div className="page-shell py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">FindBack AI</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Standalone school lost-and-found system with reporting, search, claims, moderation, and documentation.
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Built for FBLA 2025-2026</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { to: "/Search", label: "Search Items" },
                { to: "/ReportFound", label: "Report Found Item" },
                { to: "/ReportLost", label: "Report Lost Item" },
                { to: "/Documentation", label: "Project Documentation" },
                { to: "/Accessibility", label: "Accessibility Statement" },
                { to: "/Sources", label: "Sources & Citations" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                lostandfound@school.edu
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                Main Office, Room 102
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} FindBack AI · Pleasant Valley High School · FBLA Website Coding & Development
          </p>
          <p>
            This judging build stores data locally in the current browser for demo purposes.
          </p>
        </div>
      </div>
    </footer>
  );
}
